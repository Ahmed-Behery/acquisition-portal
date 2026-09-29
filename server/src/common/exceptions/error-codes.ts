/**
 * Stable, machine-readable error codes.
 *
 * Clients branch on these, never on the human-readable message — messages are
 * free to change, and will be localised. Codes are append-only: once shipped,
 * a code's meaning must not change.
 */
export const ErrorCode = {
  // --- Validation & request shape (400 / 422) ---
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MALFORMED_REQUEST: 'MALFORMED_REQUEST',

  // --- Authentication (401) ---
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',

  // --- Account state (401 / 403 / 423) ---
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  PASSWORD_CHANGE_REQUIRED: 'PASSWORD_CHANGE_REQUIRED',

  // --- Authorization (403) ---
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',

  // --- Resources (404 / 409) ---
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // --- Rate limiting (429) ---
  RATE_LIMITED: 'RATE_LIMITED',

  // --- Server (500 / 503) ---
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
