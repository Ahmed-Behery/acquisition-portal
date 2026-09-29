import request from 'supertest';
import type { Server } from 'node:http';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import { createTestApp, resetDatabase, seedUser, type TestContext } from './app.factory';

/**
 * End-to-end coverage of the authentication surface.
 *
 * These run against a real PostgreSQL and the real guard stack, which is the
 * point: the properties being asserted — default-deny, rotation, reuse
 * detection, uniform failures — emerge from several components interacting,
 * and every one of them passes its own unit test while the composition is
 * broken.
 */
describe('Auth (e2e)', () => {
  let context: TestContext;
  let server: Server;

  const LOGIN = '/api/v1/auth/login';
  const REFRESH = '/api/v1/auth/refresh';

  beforeAll(async () => {
    context = await createTestApp();
    server = context.app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await context.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(context.dataSource);
  });

  /** Pulls the refresh cookie out of a Set-Cookie header. */
  const refreshCookieFrom = (response: request.Response): string => {
    const raw = response.headers['set-cookie'] as unknown as string[] | undefined;
    const cookie = raw?.find((entry) => entry.startsWith('cap_refresh='));
    if (!cookie) throw new Error('No refresh cookie was set.');
    return cookie.split(';')[0];
  };

  describe('POST /auth/login', () => {
    it('returns an access token and sets an HttpOnly refresh cookie', async () => {
      const { password } = await seedUser(context);

      const response = await request(server)
        .post(LOGIN)
        .send({ username: 'y.fahmy', password })
        .expect(200);

      expect(response.body).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
      expect(typeof response.body.accessToken).toBe('string');

      const setCookie = response.headers['set-cookie'] as unknown as string[];
      const refresh = setCookie.find((entry) => entry.startsWith('cap_refresh='))!;

      // The refresh token must be unreachable from page JavaScript, so an XSS
      // flaw cannot exfiltrate a long-lived credential.
      expect(refresh).toContain('HttpOnly');
      expect(refresh).toContain('Path=/api/v1/auth');
      expect(refresh).toMatch(/SameSite=Lax/i);
    });

    it('never returns the refresh token in the body', async () => {
      const { password } = await seedUser(context);

      const response = await request(server)
        .post(LOGIN)
        .send({ username: 'y.fahmy', password })
        .expect(200);

      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('never returns the password hash', async () => {
      const { password } = await seedUser(context);

      const response = await request(server)
        .post(LOGIN)
        .send({ username: 'y.fahmy', password })
        .expect(200);

      expect(JSON.stringify(response.body)).not.toContain('argon2');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('returns an identical response for an unknown user and a wrong password', async () => {
      await seedUser(context);

      const unknown = await request(server)
        .post(LOGIN)
        .send({ username: 'nobody', password: 'whatever' })
        .expect(401);

      const wrong = await request(server)
        .post(LOGIN)
        .send({ username: 'y.fahmy', password: 'Wrong-Password-1!' })
        .expect(401);

      expect(unknown.body.code).toBe('INVALID_CREDENTIALS');
      expect(unknown.body.detail).toBe(wrong.body.detail);
      expect(unknown.body.code).toBe(wrong.body.code);
    });

    it('locks the account after the configured number of failures', async () => {
      await seedUser(context);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await request(server)
          .post(LOGIN)
          .send({ username: 'y.fahmy', password: 'Wrong-Password-1!' })
          .expect(401);
      }

      // The sixth attempt meets the lock rather than a credential check —
      // even with the correct password.
      const locked = await request(server)
        .post(LOGIN)
        .send({ username: 'y.fahmy', password: 'Correct-Horse-1!' })
        .expect(423);

      expect(locked.body.code).toBe('ACCOUNT_LOCKED');
      expect(locked.body.details?.retryAfterSeconds ?? locked.body.retryAfterSeconds).toBeDefined();
    });

    it('refuses a deactivated account', async () => {
      const { password } = await seedUser(context, { isActive: false });

      const response = await request(server)
        .post(LOGIN)
        .send({ username: 'y.fahmy', password })
        .expect(403);

      expect(response.body.code).toBe('ACCOUNT_INACTIVE');
    });

    it('rejects undeclared properties rather than ignoring them', async () => {
      await seedUser(context);

      // forbidNonWhitelisted. Without it, `role` would be silently dropped —
      // and a future DTO change could make it meaningful.
      await request(server)
        .post(LOGIN)
        .send({ username: 'y.fahmy', password: 'Correct-Horse-1!', role: 'Admin' })
        .expect(422);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the refresh token on each use', async () => {
      const { password } = await seedUser(context);

      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });
      const first = refreshCookieFrom(login);

      const refreshed = await request(server).post(REFRESH).set('Cookie', first).expect(200);
      const second = refreshCookieFrom(refreshed);

      expect(second).not.toBe(first);
      expect(typeof refreshed.body.accessToken).toBe('string');
    });

    // The property that bounds the damage from a stolen refresh token.
    it('revokes the whole family when a used token is presented again', async () => {
      const { password } = await seedUser(context);

      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });
      const stolen = refreshCookieFrom(login);

      const rotated = await request(server).post(REFRESH).set('Cookie', stolen).expect(200);
      const current = refreshCookieFrom(rotated);

      // Replaying the superseded token is treated as theft.
      const reuse = await request(server).post(REFRESH).set('Cookie', stolen).expect(401);
      expect(reuse.body.code).toBe('REFRESH_TOKEN_REUSED');

      // ...and the legitimate successor is revoked along with it.
      await request(server).post(REFRESH).set('Cookie', current).expect(401);
    });

    it('rejects an access token presented at the refresh endpoint', async () => {
      const { password } = await seedUser(context);

      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });

      await request(server)
        .post(REFRESH)
        .send({ refreshToken: login.body.accessToken as string })
        .expect(401);
    });

    it('rejects a request with no token at all', async () => {
      await request(server).post(REFRESH).send({}).expect(401);
    });
  });

  describe('protected routes', () => {
    it('refuses an unauthenticated request', async () => {
      const response = await request(server).get('/api/v1/auth/me').expect(401);
      expect(response.body.code).toBe('NOT_AUTHENTICATED');
    });

    it('refuses a malformed bearer token', async () => {
      await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401);
    });

    it('returns the profile for a valid token', async () => {
      const { password } = await seedUser(context);
      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });

      const response = await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.accessToken as string}`)
        .expect(200);

      expect(response.body).toMatchObject({ username: 'y.fahmy', role: UserRole.RM });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    // RolesGuard: /users is Admin-only, and an RM must not reach it.
    it('refuses an Admin-only route to a non-administrator', async () => {
      const { password } = await seedUser(context);
      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });

      const response = await request(server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${login.body.accessToken as string}`)
        .expect(403);

      expect(response.body.code).toBe('INSUFFICIENT_ROLE');
    });

    it('allows an Admin-only route to an administrator', async () => {
      const { password } = await seedUser(context, {
        username: 'doaa.orfy',
        email: 'doaa.orfy@contact.eg',
        role: UserRole.ADMIN,
        companyId: null,
      });
      const login = await request(server).post(LOGIN).send({ username: 'doaa.orfy', password });

      await request(server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${login.body.accessToken as string}`)
        .expect(200);
    });
  });

  describe('password change', () => {
    it('confines an account that must change its password', async () => {
      const { password } = await seedUser(context, { mustChangePassword: true });
      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });
      const token = login.body.accessToken as string;

      expect(login.body.mustChangePassword).toBe(true);

      // Everything but the escape hatches is refused...
      const blocked = await request(server)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');

      // ...while /auth/me stays reachable so the client can render the prompt.
      await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('invalidates existing access tokens after a change', async () => {
      const { password } = await seedUser(context);
      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });
      const token = login.body.accessToken as string;

      await request(server)
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: password, newPassword: 'Brand-New-Password-9!' })
        .expect(204);

      // passwordChangedAt is now newer than the token's iat, so the session is
      // over on every device rather than at token expiry.
      const afterChange = await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(afterChange.body.code).toBe('TOKEN_REVOKED');

      await request(server)
        .post(LOGIN)
        .send({ username: 'y.fahmy', password: 'Brand-New-Password-9!' })
        .expect(200);
    });

    it('rejects a weak new password', async () => {
      const { password } = await seedUser(context);
      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });

      await request(server)
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${login.body.accessToken as string}`)
        .send({ currentPassword: password, newPassword: 'short' })
        .expect(422);
    });
  });

  describe('logout', () => {
    it('revokes the refresh token and clears the cookie', async () => {
      const { password } = await seedUser(context);
      const login = await request(server).post(LOGIN).send({ username: 'y.fahmy', password });
      const cookie = refreshCookieFrom(login);

      await request(server).post('/api/v1/auth/logout').set('Cookie', cookie).expect(204);

      await request(server).post(REFRESH).set('Cookie', cookie).expect(401);
    });

    it('succeeds even without a token, so signing out is always possible', async () => {
      await request(server).post('/api/v1/auth/logout').send({}).expect(204);
    });
  });
});
