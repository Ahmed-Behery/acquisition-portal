/** Roles and directory groups, and the small predicates built on them. */

export const ROLES = {
  ADMIN: 'Admin',
  CEO: 'CEO',
  MD: 'MD',
  HEAD_OF_PRODUCTS: 'Head of Products',
  RM: 'RM',
  EMPLOYEE: 'Employee',
};

/** Directory groups an employee account can belong to. */
export const RECIPIENT_GROUPS = ['MD', 'C-Level', 'Branch Manager'];

/** Roles that see the group-wide leadership dashboard. */
export const LEADER_ROLES = [ROLES.CEO, ROLES.MD, ROLES.ADMIN];

/** The fixed Head of Products account that validation requests are routed to. */
export const HOP_USER_ID = 'u_hop';

/** Accounts notified whenever a merchant or pipeline entry is released. */
export const RELEASE_NOTIFY_IDS = ['u_md', 'u_ceo', 'u_hop'];

/** Accounts notified when a Done Deal becomes a merchant. */
export const ONBOARDING_NOTIFY_IDS = ['u_md', 'u_ceo'];

/** Departments offered on the registration form. */
export const REGISTRATION_DEPARTMENTS = [
  { code: 'FACT', label: 'Contact Factoring (FACT)' },
  { code: 'LEASE', label: 'Contact Leasing (LEASE)' },
  { code: 'MORT', label: 'Contact Mortgage (MORT)' },
  { code: 'CRED', label: 'Contact Credit (CRED)' },
  { code: 'INS', label: 'Contact Insurance (INS)' },
  { code: 'MOTOR', label: 'Motor Care Services (MOTOR)' },
];

/** Demo accounts shown under the sign-in form. */
export const DEMO_ACCOUNTS = [
  { username: 'doaa.orfy', label: 'Doaa Orfy · Admin' },
  { username: 'd.elsayed', label: 'Dina El Sayed · Head of Products' },
  { username: 'h.mansour', label: 'Hala Mansour · CEO' },
  { username: 'y.fahmy', label: 'Youssef Fahmy · RM (FACT)' },
  { username: 'john.saad', label: 'John Saad · Employee (C-Level)' },
  { username: 'adel.kamel', label: 'Adel Kamel · Employee (Branch)' },
];

export const DEMO_PASSWORD = 'Contact@123';
export const ADMIN_MAILBOX = 'Doaa.Orfy@contact.eg';
