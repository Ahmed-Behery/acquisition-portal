import Joi from 'joi';

/**
 * Environment schema.
 *
 * This runs once, at boot, before the Nest container is built. A malformed or
 * missing variable aborts startup with a readable message — the alternative is
 * an application that starts happily and then fails on the first request that
 * touches the misconfigured subsystem.
 *
 * Rules applied here that are easy to get wrong elsewhere:
 *  · secrets have a minimum length, and the two JWT secrets must differ;
 *  · production forbids the development defaults outright;
 *  · CORS in production must name explicit origins — '*' is rejected.
 */

const DEV_PLACEHOLDER = /^change-me-dev-only/;

const secret = (label: string) =>
  Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': `${label} must be at least 32 characters. Generate one with: openssl rand -base64 48`,
    });

export const validationSchema = Joi.object({
  // --- Runtime ---
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  API_PREFIX: Joi.string().default('api'),

  // --- Database ---
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
  DB_SCHEMA: Joi.string().default('public'),
  DB_SSL: Joi.boolean().default(false),
  DB_POOL_MAX: Joi.number().min(1).max(100).default(10),
  DB_POOL_MIN: Joi.number().min(0).default(2),
  DB_CONNECTION_TIMEOUT_MS: Joi.number().min(1000).default(10_000),
  DB_IDLE_TIMEOUT_MS: Joi.number().min(1000).default(30_000),
  DB_STATEMENT_TIMEOUT_MS: Joi.number().min(1000).default(15_000),
  DB_LOGGING: Joi.string().valid('none', 'error', 'all').default('error'),
  DB_SLOW_QUERY_MS: Joi.number().min(0).default(500),

  // --- JWT ---
  JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: secret('JWT_REFRESH_SECRET'),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),

  // --- Password policy ---
  ARGON2_MEMORY_KIB: Joi.number().min(8192).default(19_456),
  ARGON2_TIME_COST: Joi.number().min(2).default(2),
  ARGON2_PARALLELISM: Joi.number().min(1).default(1),
  PASSWORD_MIN_LENGTH: Joi.number().min(8).default(12),

  // --- Brute-force protection ---
  LOGIN_MAX_ATTEMPTS: Joi.number().min(1).default(5),
  LOGIN_ATTEMPT_WINDOW_MINUTES: Joi.number().min(1).default(15),
  LOGIN_LOCKOUT_MINUTES: Joi.number().min(1).default(15),

  // --- HTTP security ---
  CORS_ORIGINS: Joi.string().required(),
  CORS_CREDENTIALS: Joi.boolean().default(true),
  BODY_LIMIT: Joi.string().default('1mb'),
  REQUEST_TIMEOUT_MS: Joi.number().min(1000).default(30_000),
  TRUST_PROXY: Joi.boolean().default(false),

  // --- Rate limiting ---
  THROTTLE_TTL_SECONDS: Joi.number().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().min(1).default(100),
  THROTTLE_AUTH_TTL_SECONDS: Joi.number().min(1).default(300),
  THROTTLE_AUTH_LIMIT: Joi.number().min(1).default(10),

  // --- Cookies ---
  COOKIE_SECRET: secret('COOKIE_SECRET'),
  COOKIE_DOMAIN: Joi.string().allow('').default(''),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),

  // --- Observability ---
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  LOG_PRETTY: Joi.boolean().default(false),

  // --- Docs ---
  SWAGGER_ENABLED: Joi.boolean().default(false),

  // --- Seeding (optional; only read by the seed script) ---
  SEED_ADMIN_EMAIL: Joi.string().email().optional(),
  SEED_ADMIN_USERNAME: Joi.string().optional(),
  SEED_ADMIN_NAME: Joi.string().optional(),
  SEED_ADMIN_PASSWORD: Joi.string().optional(),
})
  // Production hardening. These are the mistakes that actually reach production,
  // so they are constraints rather than documentation.
  .custom((env: Record<string, unknown>, helpers) => {
    // Applies in every environment: one shared secret means a leaked
    // access-token key can mint refresh tokens.
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      return helpers.error('any.custom', {
        message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.',
      });
    }

    if (env.NODE_ENV !== 'production') return env;

    const placeholders = (
      ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'] as const
    ).filter((key) => {
      const value = env[key];
      return typeof value === 'string' && DEV_PLACEHOLDER.test(value);
    });

    if (placeholders.length > 0) {
      return helpers.error('any.custom', {
        message: `Development placeholder secrets must not be used in production: ${placeholders.join(', ')}`,
      });
    }

    if (typeof env.CORS_ORIGINS === 'string' && env.CORS_ORIGINS.split(',').includes('*')) {
      return helpers.error('any.custom', {
        message: "CORS_ORIGINS must name explicit origins in production; '*' is not permitted.",
      });
    }

    if (env.COOKIE_SECURE !== true) {
      return helpers.error('any.custom', {
        message: 'COOKIE_SECURE must be true in production so cookies are HTTPS-only.',
      });
    }

    if (env.SWAGGER_ENABLED === true) {
      // A warning rather than a failure: some teams deliberately expose docs on
      // an internal-only ingress.
      console.warn(
        '[config] SWAGGER_ENABLED=true in production — ensure /docs is not publicly reachable.',
      );
    }

    return env;
  })
  .messages({
    'any.custom': '{{#message}}',
  });
