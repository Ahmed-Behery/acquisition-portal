import {
  Catch,
  HttpException,
  HttpStatus,
  Injectable,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ThrottlerException } from '@nestjs/throttler';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import type { Request } from 'express';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode, type ErrorCodeValue } from '../exceptions/error-codes';

/**
 * PostgreSQL error classes we can map to a meaningful HTTP status.
 * Everything else is deliberately a 500 — an unrecognised database error is a
 * bug, and guessing at a 4xx would hide it.
 */
const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  SERIALIZATION_FAILURE: '40001',
  DEADLOCK_DETECTED: '40P01',
  QUERY_CANCELED: '57014',
} as const;

/** Lowest status that means "this is our fault" rather than the caller's. */
const SERVER_ERROR_THRESHOLD = 500;

/**
 * Status -> error code. A lookup rather than a switch over HttpStatus: the
 * status arriving from `exception.getStatus()` is a plain number, and
 * comparing it against enum members is exactly the mismatch that hides real
 * bugs behind a passing type-check.
 */
const CODE_BY_STATUS: Readonly<Record<number, ErrorCodeValue>> = {
  400: ErrorCode.MALFORMED_REQUEST,
  401: ErrorCode.NOT_AUTHENTICATED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  408: ErrorCode.REQUEST_TIMEOUT,
  409: ErrorCode.ALREADY_EXISTS,
  422: ErrorCode.VALIDATION_ERROR,
  423: ErrorCode.ACCOUNT_LOCKED,
  429: ErrorCode.RATE_LIMITED,
  503: ErrorCode.SERVICE_UNAVAILABLE,
};

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: ErrorCodeValue;
  detail: string;
  instance: string;
  requestId: string;
  timestamp: string;
  fields?: Record<string, string[]>;
  [key: string]: unknown;
}

interface DriverError {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
}

/**
 * The single exit point for every error leaving the API.
 *
 * Two responsibilities, and it is important they stay together:
 *
 *  1. **Shape** — every error response is RFC 7807 `application/problem+json`
 *     with a stable machine-readable `code`, so clients never parse prose.
 *
 *  2. **Containment** — internal detail (SQL, stack traces, constraint names,
 *     driver messages) is logged in full and never serialised to the client.
 *     A 5xx always returns the same generic message; the `requestId` is the
 *     thread the caller quotes to support, and the operator greps for.
 */
@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger(AllExceptionsFilter.name) private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { id?: string }>();
    const response = ctx.getResponse<Response>();

    const problem = this.toProblemDetails(exception, request);

    // 5xx is a defect or an outage: log the whole thing, stack included.
    // 4xx is the caller's problem and expected traffic: one line at debug.
    if (problem.status >= SERVER_ERROR_THRESHOLD) {
      this.logger.error(
        { err: exception, requestId: problem.requestId, path: problem.instance },
        'Unhandled exception',
      );
    } else {
      this.logger.debug(
        { code: problem.code, status: problem.status, requestId: problem.requestId },
        'Request failed',
      );
    }

    httpAdapter.setHeader(response, 'Content-Type', 'application/problem+json');
    httpAdapter.reply(response, problem, problem.status);
  }

  private toProblemDetails(exception: unknown, request: Request & { id?: string }): ProblemDetails {
    const base = {
      instance: request.url ?? '',
      requestId: request.id ?? 'unknown',
      timestamp: new Date().toISOString(),
    };

    const build = (
      status: number,
      code: ErrorCodeValue,
      detail: string,
      extra?: Record<string, unknown>,
    ): ProblemDetails => ({
      type: `https://docs.contact.eg/api/errors/${code}`,
      title: code,
      status,
      code,
      detail,
      ...base,
      ...extra,
    });

    /* --- Our own exceptions: already carry code, status and safe details --- */
    if (exception instanceof AppException) {
      return build(
        exception.getStatus(),
        exception.code,
        this.messageOf(exception),
        exception.details,
      );
    }

    /* --- Rate limiting ------------------------------------------------- */
    if (exception instanceof ThrottlerException) {
      return build(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.RATE_LIMITED,
        'Too many requests. Please slow down and try again shortly.',
      );
    }

    /* --- ValidationPipe and other Nest HttpExceptions ------------------ */
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      // ValidationPipe returns { message: string[] , error, statusCode }.
      if (
        status === 400 &&
        typeof payload === 'object' &&
        payload !== null &&
        Array.isArray((payload as { message?: unknown }).message)
      ) {
        const messages = (payload as { message: string[] }).message;
        return build(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.VALIDATION_ERROR,
          'One or more fields failed validation.',
          { fields: this.groupValidationMessages(messages) },
        );
      }

      return build(status, this.codeForStatus(status), this.messageOf(exception));
    }

    /* --- TypeORM ------------------------------------------------------- */
    if (exception instanceof EntityNotFoundError) {
      return build(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'The requested resource was not found.',
      );
    }

    if (exception instanceof QueryFailedError) {
      const driver = exception.driverError as DriverError | undefined;

      switch (driver?.code) {
        case PG_ERROR.UNIQUE_VIOLATION:
          // The constraint name can leak schema detail, so it is logged but
          // never returned. The client learns only that a conflict occurred.
          return build(
            HttpStatus.CONFLICT,
            ErrorCode.ALREADY_EXISTS,
            'A record with these details already exists.',
          );
        case PG_ERROR.FOREIGN_KEY_VIOLATION:
          return build(
            HttpStatus.CONFLICT,
            ErrorCode.CONSTRAINT_VIOLATION,
            'This operation references a record that does not exist, or is still in use.',
          );
        case PG_ERROR.NOT_NULL_VIOLATION:
        case PG_ERROR.CHECK_VIOLATION:
          return build(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorCode.CONSTRAINT_VIOLATION,
            'The submitted data violates a data-integrity rule.',
          );
        case PG_ERROR.SERIALIZATION_FAILURE:
        case PG_ERROR.DEADLOCK_DETECTED:
          return build(
            HttpStatus.CONFLICT,
            ErrorCode.VERSION_CONFLICT,
            'This record was modified concurrently. Please retry.',
          );
        case PG_ERROR.QUERY_CANCELED:
          return build(
            HttpStatus.GATEWAY_TIMEOUT,
            ErrorCode.REQUEST_TIMEOUT,
            'The database query exceeded its time limit.',
          );
        default:
          break;
      }
    }

    /* --- Anything else ------------------------------------------------- */
    return build(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred. Quote the requestId when reporting this.',
    );
  }

  private messageOf(exception: HttpException): string {
    const payload = exception.getResponse();
    if (typeof payload === 'string') return payload;
    if (typeof payload === 'object' && payload !== null) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join('; ');
    }
    return exception.message;
  }

  /**
   * class-validator emits flat strings ("email must be an email"). Grouping
   * them by the leading property name lets the frontend attach each message to
   * the input that produced it instead of dumping a list at the top of a form.
   */
  private groupValidationMessages(messages: string[]): Record<string, string[]> {
    return messages.reduce<Record<string, string[]>>((grouped, message) => {
      const field = message.split(' ')[0] ?? '_';
      (grouped[field] ??= []).push(message);
      return grouped;
    }, {});
  }

  private codeForStatus(status: number): ErrorCodeValue {
    return (
      CODE_BY_STATUS[status] ??
      (status >= SERVER_ERROR_THRESHOLD ? ErrorCode.INTERNAL_ERROR : ErrorCode.MALFORMED_REQUEST)
    );
  }
}
