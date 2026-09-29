import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from 'src/config/constants';
import type { UserRole } from 'src/modules/users/enums/user-role.enum';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import { InsufficientRoleException, UnauthenticatedException } from '../exceptions/app.exception';

/**
 * Role-based access control, enforced server-side (section 5).
 *
 * Registered globally and ordered after JwtAuthGuard. Behaviour:
 *
 *  · `@Public()`                    → allowed, no principal required;
 *  · no `@Roles()` metadata         → any authenticated user;
 *  · `@Roles(...)` with a match     → allowed;
 *  · `@Roles(...)` without a match  → 403;
 *  · `@Roles()` with an empty list  → 403 (deny), never "allow all". An empty
 *    list is almost certainly a mistake, and the safe reading of an unclear
 *    requirement is to refuse.
 *
 * The role is read from the principal that JwtStrategy loaded from the
 * database on this request, not from the JWT claim — so a revoked role takes
 * effect on the very next call.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (required === undefined) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) throw new UnauthenticatedException();

    if (required.length === 0 || !required.includes(user.role)) {
      throw new InsufficientRoleException(required);
    }

    return true;
  }
}
