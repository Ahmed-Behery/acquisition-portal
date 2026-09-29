import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/config/constants';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import { PasswordChangeRequiredException } from '../exceptions/app.exception';

/**
 * Confines an account flagged `must_change_password` to the routes it needs
 * in order to escape that state.
 *
 * Without this the flag is advisory — a client could simply not show the
 * prompt and carry on using the temporary credential the administrator
 * generated, which is precisely the password we want to stop using.
 *
 * The allowlist is matched on route path rather than on a decorator so that
 * adding a new controller cannot widen it by accident. It is deliberately
 * tiny: read your own profile, change your password, sign out.
 */
const ALLOWED_WHILE_PASSWORD_CHANGE_REQUIRED = [
  { method: 'PATCH', path: '/auth/password' },
  { method: 'GET', path: '/auth/me' },
  { method: 'POST', path: '/auth/logout' },
  { method: 'POST', path: '/auth/logout-all' },
] as const;

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.mustChangePassword) return true;

    // `request.url` carries the global prefix and version (/api/v1/auth/...),
    // so match on a suffix rather than on equality.
    const path = request.url.split('?')[0] ?? '';
    const allowed = ALLOWED_WHILE_PASSWORD_CHANGE_REQUIRED.some(
      (route) => request.method === route.method && path.endsWith(route.path),
    );

    if (!allowed) throw new PasswordChangeRequiredException();
    return true;
  }
}
