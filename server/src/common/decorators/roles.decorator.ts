import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from 'src/config/constants';
import type { UserRole } from 'src/modules/users/enums/user-role.enum';

/**
 * Restricts a route to the listed roles.
 *
 * Omitting the decorator means "any authenticated user" — it does not mean
 * "anyone", because JwtAuthGuard has already run. RolesGuard defaults to deny
 * whenever the metadata is present but unsatisfiable (section 5).
 *
 *   @Roles(UserRole.ADMIN)
 *   @Roles(UserRole.ADMIN, UserRole.HEAD_OF_PRODUCTS)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
