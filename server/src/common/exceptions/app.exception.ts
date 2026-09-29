import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, type ErrorCodeValue } from './error-codes';

/**
 * Base application exception.
 *
 * Services throw these rather than Nest's HTTP exceptions so that business
 * logic stays free of HTTP vocabulary (architecture rule 7 / 13). The status
 * lives on the exception only so the filter at the HTTP edge can map it; no
 * service ever reads it.
 *
 * `details` is echoed to the client and MUST NOT carry anything the caller is
 * not already entitled to see. `cause` is for logs only and is never
 * serialised into a response.
 */
export class AppException extends HttpException {
  readonly code: ErrorCodeValue;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCodeValue,
    message: string,
    status: HttpStatus,
    details?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super({ code, message, details }, status, { cause: options?.cause });
    this.code = code;
    this.details = details;
  }
}

/* -------------------------------------------------------------- 400 / 422 */

export class ValidationException extends AppException {
  constructor(fieldErrors: Record<string, string[]>) {
    super(
      ErrorCode.VALIDATION_ERROR,
      'One or more fields failed validation.',
      HttpStatus.UNPROCESSABLE_ENTITY,
      { fields: fieldErrors },
    );
  }
}

/* -------------------------------------------------------------------- 401 */

/**
 * Deliberately uniform for "unknown user" and "wrong password" alike —
 * section 4: authentication failures must not reveal whether an account
 * exists. AuthService pairs this with a dummy hash verification so the two
 * paths take the same time.
 */
export class InvalidCredentialsException extends AppException {
  constructor() {
    super(ErrorCode.INVALID_CREDENTIALS, 'Invalid username or password.', HttpStatus.UNAUTHORIZED);
  }
}

export class UnauthenticatedException extends AppException {
  constructor(
    code: ErrorCodeValue = ErrorCode.NOT_AUTHENTICATED,
    message = 'Authentication is required to access this resource.',
  ) {
    super(code, message, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenReuseException extends AppException {
  constructor() {
    super(
      ErrorCode.REFRESH_TOKEN_REUSED,
      'This session has been terminated. Please sign in again.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/* -------------------------------------------------------------------- 403 */

export class AccessDeniedException extends AppException {
  constructor(message = 'You do not have permission to perform this action.') {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
}

export class InsufficientRoleException extends AppException {
  constructor(required: readonly string[]) {
    // The required roles are safe to disclose: they are part of the published
    // API contract. The caller's own role is not echoed back.
    super(
      ErrorCode.INSUFFICIENT_ROLE,
      'Your role does not permit this action.',
      HttpStatus.FORBIDDEN,
      { requiredRoles: required },
    );
  }
}

export class AccountInactiveException extends AppException {
  constructor() {
    super(
      ErrorCode.ACCOUNT_INACTIVE,
      'This account has been deactivated. Contact an administrator.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class PasswordChangeRequiredException extends AppException {
  constructor() {
    super(
      ErrorCode.PASSWORD_CHANGE_REQUIRED,
      'You must change your password before continuing.',
      HttpStatus.FORBIDDEN,
    );
  }
}

/* -------------------------------------------------------------------- 404 */

export class ResourceNotFoundException extends AppException {
  constructor(resource: string, identifier?: string) {
    super(
      ErrorCode.NOT_FOUND,
      identifier ? `${resource} '${identifier}' was not found.` : `${resource} was not found.`,
      HttpStatus.NOT_FOUND,
    );
  }
}

/* -------------------------------------------------------------------- 409 */

export class ResourceConflictException extends AppException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.ALREADY_EXISTS, message, HttpStatus.CONFLICT, details);
  }
}

/**
 * Raised when an optimistic-locking `version` check fails. The caller should
 * re-read the resource and re-apply their change — this is what replaces the
 * silent last-write-wins behaviour of the legacy snapshot API.
 */
export class VersionConflictException extends AppException {
  constructor(resource: string) {
    super(
      ErrorCode.VERSION_CONFLICT,
      `This ${resource} was modified by someone else. Reload and try again.`,
      HttpStatus.CONFLICT,
    );
  }
}

/* -------------------------------------------------------------------- 423 */

export class AccountLockedException extends AppException {
  constructor(retryAfterSeconds: number) {
    super(
      ErrorCode.ACCOUNT_LOCKED,
      'Too many failed sign-in attempts. This account is temporarily locked.',
      HttpStatus.LOCKED,
      { retryAfterSeconds },
    );
  }
}
