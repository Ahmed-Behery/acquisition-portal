/**
 * Directory group for employee accounts.
 *
 * Orthogonal to UserRole: an account's role decides what it may *do*, its
 * group decides which broadcast audiences it belongs to (new-prospect
 * notifications, and eligibility to flag interest in a prospect).
 */
export enum UserGroup {
  MD = 'MD',
  C_LEVEL = 'C-Level',
  BRANCH_MANAGER = 'Branch Manager',
}
