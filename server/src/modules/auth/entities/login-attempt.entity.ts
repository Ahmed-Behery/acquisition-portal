import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Audit of every sign-in attempt, successful or not.
 *
 * Kept separate from `users.failed_login_count` because the two answer
 * different questions: the counter drives lockout, this table answers "who has
 * been probing this account, from where, and since when" — which is what a
 * security review actually asks for.
 *
 * `username` is recorded as submitted and is NOT a foreign key: attempts
 * against accounts that do not exist are exactly the ones worth keeping.
 */
@Entity('login_attempts')
@Index('idx_login_attempts_username_time', ['username', 'createdAt'])
@Index('idx_login_attempts_ip_time', ['ip', 'createdAt'])
export class LoginAttempt {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'citext' })
  username!: string;

  /** Null when the username matched no account. */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'boolean' })
  successful!: boolean;

  /** 'unknown-user' | 'bad-password' | 'locked' | 'inactive' | null when successful. */
  @Column({ name: 'failure_reason', type: 'varchar', length: 40, nullable: true })
  failureReason!: string | null;

  @Column({ type: 'inet', nullable: true })
  ip!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 400, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
