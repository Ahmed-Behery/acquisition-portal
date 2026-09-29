import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from '../types/authenticated-request';

/**
 * Injects the authenticated principal into a handler parameter.
 *
 *   findMine(@CurrentUser() user: AuthenticatedUser) { ... }
 *   findMine(@CurrentUser('id') userId: string) { ... }
 *
 * This is what keeps controllers from touching `req` directly, and services
 * from ever seeing an HTTP object (architecture rule 7): the controller
 * unwraps the principal and passes plain values down.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return field ? request.user?.[field] : request.user;
  },
);
