import {
  Injectable,
  HttpStatus,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import type { AppConfig } from 'src/config/configuration';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-codes';

/**
 * Caps how long any single request may occupy a worker.
 *
 * Without this, one slow downstream call (a hung external lookup, a query
 * missing its index) holds a connection open until the client gives up, and
 * enough of them exhaust the pool. The database has its own
 * `statement_timeout`; this is the layer above it, covering everything else.
 *
 * Note this returns 504 to the client but does not abort the underlying work —
 * genuinely cancelling an in-flight query needs cooperation from the driver.
 * The timeout is a back-pressure signal, not a kill switch.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.timeoutMs = configService.get('http', { infer: true }).requestTimeoutMs;
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(
            () =>
              new AppException(
                ErrorCode.REQUEST_TIMEOUT,
                'The request took too long to complete.',
                HttpStatus.GATEWAY_TIMEOUT,
              ),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
