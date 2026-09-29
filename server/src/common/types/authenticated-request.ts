import type { Request } from 'express';
import type { UserRole } from 'src/modules/users/enums/user-role.enum';

/**
 * The authenticated principal attached to a request by JwtStrategy.
 *
 * This is intentionally a small, flat value object rather than the User
 * entity. Handing controllers a live entity invites them to mutate and save
 * it, which would route persistence around UsersService and break the
 * repository boundary rule.
 */
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  /** Set when the account was created by an administrator or after a reset. */
  mustChangePassword: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  /** Correlation id assigned by RequestContextMiddleware. */
  id: string;
}
