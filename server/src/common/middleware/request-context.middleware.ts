import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { REQUEST_ID_HEADER } from 'src/config/constants';

/**
 * Assigns a correlation id to every request and echoes it back.
 *
 * An inbound `x-request-id` is honoured so a trace survives across services
 * (the Next.js frontend forwards its own), but only when it looks like an id
 * we issued — an unvalidated header ends up in logs and in a response header,
 * which is a log-injection and header-splitting vector.
 *
 * pino picks the same id up via `genReqId`, so every log line for a request
 * carries it, and the exception filter returns it to the caller.
 */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction): void {
    const inbound = req.headers[REQUEST_ID_HEADER];
    const candidate = Array.isArray(inbound) ? inbound[0] : inbound;

    req.id = candidate && REQUEST_ID_PATTERN.test(candidate) ? candidate : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, req.id);

    next();
  }
}
