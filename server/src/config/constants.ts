/**
 * Framework-level constants.
 *
 * Only values that are genuinely fixed for the application belong here.
 * Anything an operator might reasonably want to change per environment lives
 * in configuration and is read through ConfigService instead.
 */

/** Metadata keys read by the global guards. */
export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ROLES_KEY = 'auth:roles';

/** Name of the HttpOnly cookie carrying the refresh token. */
export const REFRESH_TOKEN_COOKIE = 'cap_refresh';

/**
 * The refresh cookie is scoped to the auth routes so it is never attached to
 * ordinary API calls. Narrower scope means a smaller window for leakage.
 */
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

/** Request header and async-context key carrying the correlation id. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Discriminator embedded in every JWT so an access token cannot be replayed as a refresh token. */
export const TOKEN_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type TokenType = (typeof TOKEN_TYPE)[keyof typeof TOKEN_TYPE];

/** Default pagination bounds applied by PaginationQueryDto. */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
} as const;

/**
 * Fields scrubbed from logs and from error payloads. pino redacts these by
 * path; the exception filter strips them from validation echoes.
 */
export const SENSITIVE_FIELDS = [
  'password',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
] as const;
