import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

/**
 * A refresh token, stored as a SHA-256 digest.
 *
 * Two deliberate decisions:
 *
 * **Hashed at rest.** The raw token is a bearer credential. Storing only its
 * digest means a dump of this table cannot be replayed against the API — the
 * same reasoning that applies to passwords.
 *
 * **Family-based rotation with reuse detection.** Every refresh issues a new
 * token and revokes the one presented, all tokens descending from a single
 * login sharing a `familyId`. If a *already-revoked* token is ever presented,
 * the only explanations are a stolen token or a badly-behaved client; either
 * way the whole family is revoked at once, which bounds the damage from a
 * leaked token to a single refresh cycle.
 *
 * This table is append-only in practice: rows are marked revoked, never
 * deleted, so an investigator can reconstruct a session's history.
 */
@Entity('refresh_tokens')
@Index('idx_refresh_tokens_user', ['userId'])
@Index('idx_refresh_tokens_family', ['familyId'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  /** SHA-256 of the raw token, hex-encoded. Unique so a lookup is a single index hit. */
  @Index('idx_refresh_tokens_hash', { unique: true })
  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash!: string;

  /** Shared by every token descended from one login. */
  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  /** 'rotated' | 'logout' | 'reuse-detected' | 'password-changed' | 'admin'. */
  @Column({ name: 'revoked_reason', type: 'varchar', length: 40, nullable: true })
  revokedReason!: string | null;

  /** The token that superseded this one; lets a family be walked in order. */
  @Column({ name: 'replaced_by_id', type: 'uuid', nullable: true })
  replacedById!: string | null;

  @Column({ type: 'inet', nullable: true })
  ip!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 400, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  get isActive(): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > Date.now();
  }
}
