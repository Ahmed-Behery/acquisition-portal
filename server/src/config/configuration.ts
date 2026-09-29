/**
 * Typed configuration.
 *
 * `validation.ts` guarantees the raw environment is well-formed; this file
 * turns it into a shaped, typed object so that no code past this point reads
 * `process.env` or parses strings. Injecting `ConfigService<AppConfig, true>`
 * then gives compile-time-checked, non-optional access to every value.
 */

export type NodeEnv = 'development' | 'test' | 'production';
export type SameSite = 'lax' | 'strict' | 'none';
export type DbLogging = 'none' | 'error' | 'all';

const toBool = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined || value === '' ? fallback : value === 'true' || value === '1';

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export interface AppConfig {
  env: NodeEnv;
  isProduction: boolean;
  isTest: boolean;
  port: number;
  apiPrefix: string;

  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    schema: string;
    ssl: boolean;
    poolMax: number;
    poolMin: number;
    connectionTimeoutMs: number;
    idleTimeoutMs: number;
    statementTimeoutMs: number;
    logging: DbLogging;
    slowQueryMs: number;
  };

  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
    issuer: string;
    audience: string;
  };

  password: {
    memoryKib: number;
    timeCost: number;
    parallelism: number;
    minLength: number;
  };

  login: {
    maxAttempts: number;
    attemptWindowMinutes: number;
    lockoutMinutes: number;
  };

  http: {
    corsOrigins: string[];
    corsCredentials: boolean;
    bodyLimit: string;
    requestTimeoutMs: number;
    trustProxy: boolean;
  };

  throttle: {
    ttlSeconds: number;
    limit: number;
    authTtlSeconds: number;
    authLimit: number;
  };

  cookie: {
    secret: string;
    domain: string | undefined;
    secure: boolean;
    sameSite: SameSite;
  };

  log: {
    level: string;
    pretty: boolean;
  };

  swagger: {
    enabled: boolean;
  };
}

export const configuration = (): AppConfig => {
  const env = (process.env.NODE_ENV ?? 'development') as NodeEnv;

  return {
    env,
    isProduction: env === 'production',
    isTest: env === 'test',
    port: toInt(process.env.PORT, 4000),
    apiPrefix: process.env.API_PREFIX ?? 'api',

    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: toInt(process.env.DB_PORT, 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      name: process.env.DB_NAME ?? 'acquisition_portal',
      schema: process.env.DB_SCHEMA ?? 'public',
      ssl: toBool(process.env.DB_SSL, false),
      poolMax: toInt(process.env.DB_POOL_MAX, 10),
      poolMin: toInt(process.env.DB_POOL_MIN, 2),
      connectionTimeoutMs: toInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10_000),
      idleTimeoutMs: toInt(process.env.DB_IDLE_TIMEOUT_MS, 30_000),
      statementTimeoutMs: toInt(process.env.DB_STATEMENT_TIMEOUT_MS, 15_000),
      logging: (process.env.DB_LOGGING ?? 'error') as DbLogging,
      slowQueryMs: toInt(process.env.DB_SLOW_QUERY_MS, 500),
    },

    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
      issuer: process.env.JWT_ISSUER ?? 'contact-acquisition-portal',
      audience: process.env.JWT_AUDIENCE ?? 'contact-acquisition-portal-web',
    },

    password: {
      memoryKib: toInt(process.env.ARGON2_MEMORY_KIB, 19_456),
      timeCost: toInt(process.env.ARGON2_TIME_COST, 2),
      parallelism: toInt(process.env.ARGON2_PARALLELISM, 1),
      minLength: toInt(process.env.PASSWORD_MIN_LENGTH, 12),
    },

    login: {
      maxAttempts: toInt(process.env.LOGIN_MAX_ATTEMPTS, 5),
      attemptWindowMinutes: toInt(process.env.LOGIN_ATTEMPT_WINDOW_MINUTES, 15),
      lockoutMinutes: toInt(process.env.LOGIN_LOCKOUT_MINUTES, 15),
    },

    http: {
      corsOrigins: toList(process.env.CORS_ORIGINS),
      corsCredentials: toBool(process.env.CORS_CREDENTIALS, true),
      bodyLimit: process.env.BODY_LIMIT ?? '1mb',
      requestTimeoutMs: toInt(process.env.REQUEST_TIMEOUT_MS, 30_000),
      trustProxy: toBool(process.env.TRUST_PROXY, false),
    },

    throttle: {
      ttlSeconds: toInt(process.env.THROTTLE_TTL_SECONDS, 60),
      limit: toInt(process.env.THROTTLE_LIMIT, 100),
      authTtlSeconds: toInt(process.env.THROTTLE_AUTH_TTL_SECONDS, 300),
      authLimit: toInt(process.env.THROTTLE_AUTH_LIMIT, 10),
    },

    cookie: {
      secret: process.env.COOKIE_SECRET ?? '',
      domain: process.env.COOKIE_DOMAIN || undefined,
      secure: toBool(process.env.COOKIE_SECURE, false),
      sameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as SameSite,
    },

    log: {
      level: process.env.LOG_LEVEL ?? 'info',
      pretty: toBool(process.env.LOG_PRETTY, false),
    },

    swagger: {
      enabled: toBool(process.env.SWAGGER_ENABLED, false),
    },
  };
};
