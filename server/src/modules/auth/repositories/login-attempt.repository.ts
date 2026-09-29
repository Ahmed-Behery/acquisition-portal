import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { LoginAttempt } from '../entities/login-attempt.entity';

export type LoginFailureReason = 'unknown-user' | 'bad-password' | 'locked' | 'inactive';

/** Persistence for the sign-in audit trail. Owned by AuthModule. */
@Injectable()
export class LoginAttemptRepository {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly repository: Repository<LoginAttempt>,
  ) {}

  async record(attempt: {
    username: string;
    userId: string | null;
    successful: boolean;
    failureReason: LoginFailureReason | null;
    ip: string | null;
    userAgent: string | null;
  }): Promise<void> {
    await this.repository.insert(this.repository.create(attempt));
  }

  /**
   * Failures for a username inside the lockout window.
   *
   * Counted from this table rather than from `users.failed_login_count` when
   * the username matches no account — there is no row to hold a counter, and
   * an attacker guessing usernames should still meet a rate limit.
   */
  countRecentFailures(username: string, since: Date): Promise<number> {
    return this.repository.count({
      where: { username, successful: false, createdAt: MoreThan(since) },
    });
  }

  countRecentFailuresByIp(ip: string, since: Date): Promise<number> {
    return this.repository.count({
      where: { ip, successful: false, createdAt: MoreThan(since) },
    });
  }
}
