/**
 * Environment for the end-to-end suite.
 *
 * Runs before the Nest container is built, so configuration validation sees
 * these values. Deliberately explicit rather than reading the developer's
 * `.env`: a test run must never be able to reach a real database, and a suite
 * that silently picks up local configuration is a suite that passes on one
 * machine and fails on another.
 *
 * Requires a live PostgreSQL. `docker compose up -d postgres` provides one;
 * CI starts it as a service container.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

process.env.DB_HOST = process.env.TEST_DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT ?? '5432';
process.env.DB_USERNAME = process.env.TEST_DB_USERNAME ?? 'portal';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? 'portal_local_password';
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'acquisition_portal_test';
process.env.DB_LOGGING = 'none';

// Distinct secrets — validation rejects reuse, which is itself worth covering.
process.env.JWT_ACCESS_SECRET = 'e2e-access-secret-value-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-value-at-least-32-characters-long';
process.env.COOKIE_SECRET = 'e2e-cookie-secret-value-at-least-32-characters-long';
process.env.JWT_ISSUER = 'contact-acquisition-portal-test';
process.env.JWT_AUDIENCE = 'contact-acquisition-portal-test-web';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '7d';

// Lowest permitted Argon2 cost: the suite hashes on nearly every test and the
// production parameters would make it take minutes.
process.env.ARGON2_MEMORY_KIB = '8192';
process.env.ARGON2_TIME_COST = '2';

process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'silent';
process.env.LOG_PRETTY = 'false';
process.env.SWAGGER_ENABLED = 'false';

// High enough not to trip during a normal run; the lockout test drives the
// account counter instead, which is the behaviour actually under test.
process.env.THROTTLE_LIMIT = '10000';
process.env.THROTTLE_AUTH_LIMIT = '10000';
process.env.LOGIN_MAX_ATTEMPTS = '5';
process.env.LOGIN_LOCKOUT_MINUTES = '15';
