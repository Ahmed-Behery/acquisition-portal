import { Column, Entity, Index, JoinColumn, ManyToOne, VersionColumn } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';
import { Company } from 'src/modules/companies/entities/company.entity';
import { UserGroup } from '../enums/user-group.enum';
import { UserRole } from '../enums/user-role.enum';

/**
 * A login account.
 *
 * `passwordHash` carries `select: false`, so it is absent from every query
 * unless a caller explicitly asks for it. Only AuthService does, via
 * `findByUsernameWithSecret`. The effect is that a hash cannot leak through a
 * careless `return user` in some future controller — the field simply is not
 * there.
 */
@Entity('users')
@Index('idx_users_company', ['companyId'])
@Index('idx_users_role', ['role'])
export class User extends BaseEntity {
  /**
   * Stored `citext`, so uniqueness and lookup are case-insensitive at the
   * database level rather than depending on every call site remembering
   * `.toLowerCase()`.
   */
  @Index('idx_users_username', { unique: true })
  @Column({ type: 'citext' })
  username!: string;

  @Index('idx_users_email', { unique: true })
  @Column({ type: 'citext' })
  email!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role!: UserRole;

  /** Directory group; drives notification audiences, not permissions. */
  @Column({ type: 'enum', enum: UserGroup, enumName: 'user_group', nullable: true })
  group!: UserGroup | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @ManyToOne(() => Company, (company) => company.users, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'company_id' })
  company?: Company | null;

  @Column({ name: 'job_title', type: 'varchar', length: 200, nullable: true })
  jobTitle!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  /** Argon2id digest. Never selected unless asked for by name. */
  @Column({ name: 'password_hash', type: 'text', select: false })
  passwordHash!: string;

  /**
   * Any access token issued before this instant is rejected by JwtStrategy.
   * That is what makes a password change log out every other device
   * immediately rather than at token expiry.
   */
  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true })
  passwordChangedAt!: Date | null;

  @Column({ name: 'must_change_password', type: 'boolean', default: false })
  mustChangePassword!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  /* --- Brute-force protection ------------------------------------------ */

  @Column({ name: 'failed_login_count', type: 'int', default: 0 })
  failedLoginCount!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  /**
   * Optimistic locking. TypeORM raises OptimisticLockVersionMismatchError when
   * a save is attempted against a stale version, which the service surfaces as
   * a 409 — replacing the legacy behaviour where the last writer silently won.
   */
  @VersionColumn()
  version!: number;

  /* --- Derived helpers (no persistence, no business rules) -------------- */

  get isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil.getTime() > Date.now();
  }
}
