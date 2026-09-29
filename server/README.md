# Corporate Acquisition Portal — API

NestJS + TypeORM + PostgreSQL backend for the Contact Group client and pipeline platform.

This is the foundation described as **Phase 1, Phase 2 (partial) and Phase 4** of the gap
analysis: configuration, database, error handling, observability, authentication,
authorization, and the `companies` / `users` domain. The pipeline, approvals, merchants,
interests, notifications and analytics modules build on top of it.

---

## Quick start

```bash
cd server
cp .env.example .env          # edit secrets; the app refuses to start without valid ones
npm ci

docker compose up -d postgres # or point .env at an existing PostgreSQL 16
npm run migration:run
npm run seed                  # 7 group companies + one bootstrap administrator

npm run start:dev             # http://localhost:4000/api/v1  ·  docs at /docs
```

The seeded administrator is flagged `must_change_password`: every endpoint except
`GET /auth/me`, `PATCH /auth/password` and the logout routes returns `403
PASSWORD_CHANGE_REQUIRED` until the password is changed.

### Commands

| Command | What it does |
|---|---|
| `npm run start:dev` | Watch mode |
| `npm run build` / `start:prod` | Compile / run compiled output |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint (type-aware) |
| `npm run format` / `format:check` | Prettier |
| `npm test` / `test:cov` | Unit tests |
| `npm run test:e2e` | End-to-end tests — **requires a running PostgreSQL** |
| `npm run migration:generate -- src/database/migrations/Name` | Draft a migration from entity changes |
| `npm run migration:run` / `migration:revert` / `migration:show` | Apply / roll back / list |
| `npm run seed` | Idempotent reference-data seed |

---

## Architecture

```
src/
├── config/          configuration.ts · validation.ts · constants.ts
├── common/          decorators · dto · exceptions · filters · guards
│                    interceptors · middleware · transforms · types · validators
├── database/        data-source.ts · database.module.ts · entities/base
│                    migrations/ · seeds/
└── modules/
    ├── auth/        sign-in, JWT issue/rotate/revoke, lockout, password change
    ├── users/       account administration, role invariants
    ├── companies/   the seven group companies (reference data)
    ├── password/    Argon2id hashing, shared by auth and users
    └── health/      liveness and readiness probes
```

Each feature module is `controllers/ · services/ · repositories/ · dtos/ · entities/`.

### The rules this code actually follows

**Controllers do three things**: unwrap the request, call a service, map the result to a
DTO. No repository access, no business rules, no `req`/`res` beyond cookie handling in
`AuthController` (cookies are an HTTP transport detail and belong at the edge).

**Services hold the logic** and never see an HTTP object. They throw domain exceptions
from `common/exceptions`; the global filter maps those to status codes at the boundary.

**Repositories hold SQL** and nothing else — no policy, no cross-entity knowledge.

**The repository boundary is enforced by the container, not by convention.** Each module
exports only its service:

```
UsersModule    exports UsersService     (not UsersRepository, not User)
CompaniesModule exports CompaniesService
AuthModule     exports TokenService
```

`AuthService` needs user rows, so `UsersService` exposes a small named contract for it
(`findByUsernameForAuthentication`, `recordFailedLogin`, `updatePassword`, …). A module
that tries to inject `UsersRepository` fails at container build time, so the role and
company invariants cannot be routed around.

**`PasswordModule` exists to avoid a cycle.** `AuthModule` already imports `UsersModule`;
both need hashing, so putting `PasswordService` in either would make the other import it
circularly.

---

## Security

Controls implemented, and the reasoning where it is not obvious.

### Authentication

- **Argon2id**, parameters from configuration (OWASP baseline: 19 MiB, t=2, p=1). The
  legacy app used `bcryptjs` — pure JS, ~10× slower than native bcrypt, which forces a low
  cost factor to keep logins responsive.
- **Transparent rehash** on sign-in when the stored digest used weaker parameters, so
  raising the cost factor upgrades existing accounts without a forced reset.
- **Uniform failures.** Unknown username, wrong password and deactivated account all
  return the same `401 INVALID_CREDENTIALS`. The unknown-username path verifies a dummy
  hash so it takes the same time — without that, the response latency enumerates valid
  accounts no matter how carefully the messages are worded.
- **Account lockout** after N failures inside a rolling window, counted from
  `login_attempts` rather than a persistent counter so old failures age out.
- **Locked accounts return `423`** — the one place a distinct response is justified,
  because the user needs to know to wait. It does reveal that the account exists; that is
  the accepted cost of a usable lockout.

### Tokens

- **Access token** (15 min) in the response body, for the SPA to hold in memory.
- **Refresh token** (7 days) in an HttpOnly, `SameSite`, path-scoped cookie. Page
  JavaScript cannot read it, so an XSS flaw steals at most a 15-minute credential instead
  of a persistent foothold.
- **Separate signing secrets** for access and refresh; validation rejects reuse.
- **Every token carries `typ`**, checked on both paths — otherwise an access token could
  be exchanged for a fresh long-lived pair.
- **Rotation with reuse detection.** Each refresh revokes the presented token and issues a
  successor in the same family. Presenting an already-revoked token means theft or replay,
  so the whole family is revoked. A stolen refresh token therefore buys one cycle and
  locks both parties out, rather than granting silent long-term access.
- **Only SHA-256 digests are stored.** Correct here and wrong for a password: these are
  256 bits of CSPRNG output, so there is nothing to brute-force.
- **`JwtStrategy` re-reads the user on every request** and checks `isActive` and
  `passwordChangedAt > iat`. Costs one indexed primary-key lookup; buys immediate
  revocation instead of a window up to the full token lifetime. The right trade for a
  system holding financial records.

### Authorization

- **Default-deny.** `JwtAuthGuard` is an `APP_GUARD`; a new controller is protected the
  moment it is written. `@Public()` is the explicit, greppable exception — search for it to
  audit the entire unauthenticated surface.
- **`RolesGuard` reads the role from the freshly-loaded principal**, not the JWT claim, so
  a revoked role takes effect on the next request.
- **`@Roles()` with an empty list denies.** An empty list is almost certainly a mistake,
  and the safe reading of an unclear requirement is to refuse.
- **`PasswordChangeGuard`** confines accounts on a temporary credential to a four-route
  allowlist.

### HTTP

Helmet with a locked-down CSP (`default-src 'none'` — this API serves no HTML), HSTS,
`no-referrer`; CORS restricted to explicit origins with credentials; `x-powered-by`
disabled; body size limits; per-request timeout; two rate-limit buckets, with `/auth/login`
and `/auth/refresh` on the stricter one.

`ValidationPipe` runs globally with `whitelist`, `forbidNonWhitelisted`, `transform` and
`forbidUnknownValues`. Submitted values are never echoed in error responses.

### Guard order

Registration order in `app.module.ts` is load-bearing:

1. `ThrottlerGuard` — reject floods before doing work
2. `JwtAuthGuard` — establish the principal
3. `RolesGuard` — check the role
4. `PasswordChangeGuard` — confine temporary credentials

---

## Errors

Every error leaves through `AllExceptionsFilter` as RFC 7807 `application/problem+json`:

```json
{
  "type": "https://docs.contact.eg/api/errors/INSUFFICIENT_ROLE",
  "title": "INSUFFICIENT_ROLE",
  "status": 403,
  "code": "INSUFFICIENT_ROLE",
  "detail": "Your role does not permit this action.",
  "instance": "/api/v1/users",
  "requestId": "0f8c…",
  "timestamp": "2026-09-21T09:14:22.418Z"
}
```

Clients branch on `code` (stable, append-only — see `common/exceptions/error-codes.ts`),
never on prose. A 5xx logs in full and returns a fixed generic message: SQL, stack traces
and constraint names never reach the client. `requestId` is the thread the caller quotes
and the operator greps.

Validation failures return `422` with messages grouped by field, so the frontend can attach
each one to the input that produced it.

---

## Database

PostgreSQL 16, TypeORM, explicit SQL migrations.

- **`synchronize` is hard-coded `false`**, not configurable. A staging flag that can reach
  production and rewrite a live schema on boot is a category of accident worth designing
  out.
- **Migrations are hand-written SQL.** Generated ones are convenient and almost right —
  they routinely miss partial indexes, CHECK constraints and extension setup, all of which
  are load-bearing here.
- **UUID primary keys** (`gen_random_uuid()`), **`timestamptz` everywhere**. The legacy
  store kept display strings (`'Apr 22, 2026'`) — unsortable, unqueryable, ambiguous across
  timezones.
- **`citext`** for username and email, so case-insensitive uniqueness is a database
  constraint rather than a `.toLowerCase()` every call site must remember.
- **Soft delete by default** — a deleted record still has to be explicable to an auditor.
- **`@VersionColumn`** on mutable entities; a stale `version` returns `409
  VERSION_CONFLICT` instead of silently overwriting a concurrent edit.
- **Pool, connection, idle and `statement_timeout`** all configured.
- Constraints that matter are in the schema as well as the service: `chk_users_rm_requires_company`
  backs up the application-level check.

---

## Observability

`nestjs-pino`, NDJSON in production, pretty locally. Every log line carries a `requestId`
that matches the `X-Request-Id` response header and the `requestId` in error payloads. An
inbound `X-Request-Id` is honoured only when it matches a strict pattern — an unvalidated
header ends up in logs and in a response header, which is a log-injection vector.

Redaction covers `authorization`, `cookie`, `set-cookie` and every field in
`SENSITIVE_FIELDS`, at nested paths. 4xx logs at `warn`, 5xx at `error`; health probes are
excluded so they do not drown the log.

Probes are at `/health/live` and `/health/ready`, outside the API prefix. Liveness
deliberately does **not** touch the database: if it did, a brief Postgres outage would make
Kubernetes kill every API pod, turning a recoverable dependency failure into a full outage
with a cold start at the end of it.

---

## Testing

- **Unit** (`npm test`) — 32 tests over `AuthService` and `UsersService`, weighted towards
  the security properties rather than happy paths, because those are the ones that break
  silently. A refactor returning a different exception for an unknown username still passes
  a "login works" test while reintroducing account enumeration.
- **End-to-end** (`npm run test:e2e`) — boots the real app against a real PostgreSQL and
  runs the real guard stack. Schema comes from the migrations, never `synchronize`, so a
  broken migration fails here rather than on deployment night.

CI additionally proves migrations apply to an empty database **and roll back** — a `down`
nobody runs is a `down` that does not work on the night it is needed.

---

## Configuration

Every variable is validated by Joi at boot; the process refuses to start on a missing or
malformed value. Production additionally rejects development placeholder secrets, `'*'` in
`CORS_ORIGINS`, and `COOKIE_SECURE=false`.

See [.env.example](.env.example) for the full list with commentary.

Nothing past `config/` reads `process.env`. Inject `ConfigService<AppConfig, true>` and
access typed, non-optional values:

```ts
const jwt = configService.get('jwt', { infer: true });
```

---

## Endpoint summary

| Method | Route | Auth | Roles |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | public | — |
| `POST` | `/api/v1/auth/refresh` | refresh cookie | — |
| `POST` | `/api/v1/auth/logout` | public (idempotent) | — |
| `POST` | `/api/v1/auth/logout-all` | access token | any |
| `GET` | `/api/v1/auth/me` | access token | any |
| `GET` | `/api/v1/auth/sessions` | access token | any |
| `PATCH` | `/api/v1/auth/password` | access token | any |
| `GET` | `/api/v1/users` | access token | Admin |
| `GET` | `/api/v1/users/directory` | access token | any |
| `GET` | `/api/v1/users/:id` | access token | Admin |
| `POST` | `/api/v1/users` | access token | Admin |
| `PATCH` | `/api/v1/users/:id` | access token | Admin |
| `PATCH` | `/api/v1/users/:id/activate` | access token | Admin |
| `DELETE` | `/api/v1/users/:id` | access token | Admin |
| `GET` | `/api/v1/companies` | access token | any |
| `GET` | `/api/v1/companies/:id` | access token | any |
| `GET` | `/api/v1/companies/code/:code` | access token | Admin, Head of Products |
| `GET` | `/health/live` · `/health/ready` | public | — |

`POST /users` returns a generated single-use password **once**. It is never persisted in
readable form and cannot be retrieved again — a credential an administrator can look up
later is a credential that outlives its purpose.

---

## Deliberately not included

Named so they are decisions rather than oversights.

- **Self-registration.** The legacy app let anyone with the URL create an `RM` account and
  be signed in immediately. Account creation in a system holding deal values and client
  contact details is an administrative act.
- **Demo accounts.** 85 accounts sharing `Contact@123`, six of them printed on the login
  page, are not carried forward.
- **Password reset by email.** Needs the mail infrastructure from the notifications module;
  administrators currently reissue a credential.
- **Breached-password check.** The single biggest remaining win — a 12-character password
  that appears in every credential-stuffing list passes every rule in
  `IsStrongPasswordConstraint`. Add a HIBP k-anonymity range query or a local Bloom filter.
- **Redis-backed rate limiting.** In-memory storage is correct for one instance; behind
  more than one, the effective limit multiplies by instance count.
- **CSRF tokens.** Not needed while the access token travels in an `Authorization` header
  rather than a cookie. Required the moment that changes.
- **MFA and SSO.** `@contact.eg` suggests Microsoft 365; Entra ID SSO is the natural next
  step for leadership and Admin accounts.
