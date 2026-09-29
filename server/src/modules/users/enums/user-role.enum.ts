/**
 * Roles in the Corporate Acquisition Portal.
 *
 * The string values match the legacy `data/store.json` exactly, so the
 * migration that imports existing records does not have to translate them and
 * historic audit rows stay readable.
 *
 * These are the real roles of the business, not a generic USER/ADMIN pair:
 * authorization in this product turns on the difference between a Relationship
 * Manager (owns a book of prospects) and the Head of Products (the sole
 * approver of every pipeline gate), and a two-role model cannot express that.
 */
export enum UserRole {
  /** Platform administrator — user management, reference lists, audit. */
  ADMIN = 'Admin',
  /** Chief Executive Officer — group-wide read, may flag interest. */
  CEO = 'CEO',
  /** Managing Director — group-wide read, may flag interest, SLA escalation target. */
  MD = 'MD',
  /** The single approver for every pipeline approval gate. */
  HEAD_OF_PRODUCTS = 'Head of Products',
  /** Relationship Manager — owns prospects and merchants within one company. */
  RM = 'RM',
  /** Directory employee — may enter prospects and receive delegated leads. */
  EMPLOYEE = 'Employee',
}

/** Roles that see group-wide data rather than only their own book. */
export const LEADERSHIP_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.CEO,
  UserRole.MD,
  UserRole.HEAD_OF_PRODUCTS,
] as const;

/** Roles whose visibility is scoped to the records they own. */
export const SCOPED_ROLES: readonly UserRole[] = [UserRole.RM, UserRole.EMPLOYEE] as const;

/** Roles that must belong to a group company. */
export const COMPANY_BOUND_ROLES: readonly UserRole[] = [UserRole.RM] as const;
