# Contact Group · Client & Pipeline Platform

Next.js 15 (Pages Router, JavaScript) migration of the original single-file HTML/CSS/JS
application. The UI, the workflows and the business rules are unchanged; the
architecture underneath them is not.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build
npm start          # production
```

`data/store.json` is created on first run from `src/server/seed.js`. Delete it to reseed.

### Demo accounts (password `Contact@123`)

| Role             | Username     |
| ---------------- | ------------ |
| Admin            | `doaa.orfy`  |
| Head of Products | `d.elsayed`  |
| CEO              | `h.mansour`  |
| RM (FACT)        | `y.fahmy`    |

### Configuration

Every variable is optional — copy `.env.example` to `.env.local`.

| Variable                                             | Effect                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` / `SECURE` / `FROM` | Set `SMTP_HOST` to deliver admin alerts as real email. Without it they stay in-app and logged. |
| `ADMIN_EMAIL`                                        | Where those alerts go. Defaults to `Doaa.Orfy@contact.eg`.           |
| `OPENCORPORATES_API_TOKEN`                           | Raises the rate limit on the Egypt company lookup.                   |

## Structure

```
src/
├── pages/            routes + API routes (Pages Router)
├── layouts/          the signed-in shell (sidebar + topbar)
├── components/       UI, grouped by feature, with common/ for shared pieces
├── domain/           business rules and actions — no React, no DOM
│   ├── selectors.js      read-only lookups over state
│   ├── pipelineRules.js  predicates, screening, code generation
│   ├── notifications.js  the notification fan-out
│   └── actions/          every mutation, one module per area
├── store/            the application store and its provider
├── hooks/            React bindings for the store, auth, forms, drafts
├── services/         everything that talks to the server or browser storage
├── server/           server-only: JSON store, sessions, auth, mailer, page guard
├── constants/        pipeline stages, SLAs, roles, navigation
├── utils/            formatting, dates, routing, dialogs
├── theme/            design tokens + the MUI theme built from them
└── styles/           globals.css — the original stylesheet, authoritative for the look
```

`scripts/generators/` holds the document/deck generators from the original project.
They are standalone Node scripts and are not part of the web app; their dependencies
(`docx`, `pptxgenjs`) are dev dependencies so they never reach the client bundle.

## How it fits together

**State.** One store (`src/store/appStore.js`) holds the shared snapshot. Actions
mutate it in place — the same model the original used — and React subscribes through
`useSyncExternalStore`, so the ported business logic kept its exact semantics while
rendering stays correct under concurrent React. Changes are written back to
`PUT /api/state` debounced, on a 2.5s sweep, and via `sendBeacon` when the page goes
away.

**Data loading.** `withProtectedPage` (in `src/server/pageGuard.js`) does the auth
check on the server and ships the state snapshot with the document, so a page renders
server-side with real content. In-app navigations deliberately skip the payload: the
store is already the live copy, and re-seeding it would discard unflushed changes.

**Styling.** `src/styles/globals.css` is the original stylesheet, carried over intact.
The design tokens live in `src/theme/tokens.js` and are emitted as CSS custom
properties by `_document.js`, so CSS and JS read the same values. MUI supplies the
theme and the accessible `Modal` primitive; it deliberately does not restyle the
existing markup.

**Dates.** Anything rendered from "today" reads `state.today`, seeded by the server and
corrected on mount, so the server and client never disagree during hydration.

## Notes for the next developer

- `window.alert` / `confirm` / `prompt` are intentionally preserved (routed through
  `src/utils/dialogs.js`) because several workflows depend on their synchronous
  result. Replacing them with in-app dialogs is a self-contained change: swap that
  module's implementation and make the callers `await`.
- Notification `link` fields still use the original `"page-key/id"` format so existing
  stored data keeps working. `src/utils/links.js` translates them to routes.
- The JSON store is last-write-wins, as before. It is fine for this workload; a
  database swap only has to satisfy `src/server/state.js`.
