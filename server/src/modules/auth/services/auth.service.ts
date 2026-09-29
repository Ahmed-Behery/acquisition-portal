import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from 'src/config/configuration';
import {
  AccountInactiveException,
  AccountLockedException,
  InvalidCredentialsException,
} from 'src/common/exceptions/app.exception';
import { PasswordService } from 'src/modules/password/services/password.service';
import { UsersService } from 'src/modules/users/services/users.service';
import type { User } from 'src/modules/users/entities/user.entity';
import {
  LoginAttemptRepository,
  type LoginFailureReason,
} from '../repositories/login-attempt.repository';
import { TokenService, type TokenContext, type TokenPair } from './token.service';
import type { ChangePasswordDto } from '../dtos/change-password.dto';
import type { LoginDto } from '../dtos/login.dto';

export interface LoginResult {
  user: User;
  tokens: TokenPair;
}

/**
 * Authentication logic.
 *
 * Reads and writes the users table only through UsersService — the repository
 * boundary rule. Knows nothing about HTTP: cookies, headers and status codes
 * are the controller's concern, and this class throws domain exceptions the
 * filter maps at the edge.
 *
 * The governing rule throughout is that a failed sign-in must be
 * indistinguishable regardless of *why* it failed. Unknown username, wrong
 * password and deactivated account all return the same
 * InvalidCredentialsException, and the unknown-username path deliberately
 * spends the same CPU time hashing as the others so it cannot be told apart by
 * a stopwatch (section 4).
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly maxAttempts: number;
  private readonly attemptWindowMs: number;
  private readonly lockoutMs: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly loginAttemptRepository: LoginAttemptRepository,
    configService: ConfigService<AppConfig, true>,
  ) {
    const login = configService.get('login', { infer: true });
    this.maxAttempts = login.maxAttempts;
    this.attemptWindowMs = login.attemptWindowMinutes * 60_000;
    this.lockoutMs = login.lockoutMinutes * 60_000;
  }

  /* ---------------------------------------------------------------- login */

  async login(dto: LoginDto, context: TokenContext): Promise<LoginResult> {
    const user = await this.usersService.findByUsernameForAuthentication(dto.username);

    if (!user) {
      // Burn equivalent Argon2 time so the unknown-user branch is not
      // detectably faster, then fail with the same message as every other
      // branch. Recorded because probing for valid usernames is exactly what
      // the audit trail is for.
      await this.passwordService.verifyDummy(dto.password);
      await this.recordAttempt(dto.username, null, false, 'unknown-user', context);
      throw new InvalidCredentialsException();
    }

    if (user.isLocked) {
      const retryAfterSeconds = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 1000);
      await this.recordAttempt(dto.username, user.id, false, 'locked', context);
      // The one case where a distinct response is justified: the user needs to
      // know to wait rather than keep guessing. It reveals that the account
      // exists, which is the accepted cost of a usable lockout.
      throw new AccountLockedException(retryAfterSeconds);
    }

    const passwordMatches = await this.passwordService.verify(user.passwordHash, dto.password);

    if (!passwordMatches) {
      await this.registerFailure(user, dto.username, context);
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) {
      // Checked after the password so a deactivated account cannot be
      // distinguished from a wrong password by anyone who lacks the real one.
      await this.recordAttempt(dto.username, user.id, false, 'inactive', context);
      throw new AccountInactiveException();
    }

    // Transparent upgrade: if the Argon2 parameters have been raised since
    // this hash was written, replace it now while the plaintext is in hand.
    if (this.passwordService.needsRehash(user.passwordHash)) {
      const rehashed = await this.passwordService.hash(dto.password);
      await this.usersService.updatePassword(
        user.id,
        rehashed,
        user.passwordChangedAt ?? new Date(),
      );
      this.logger.log(`Rehashed password for ${user.username} with current parameters.`);
    }

    const now = new Date();
    await this.usersService.recordSuccessfulLogin(user.id, now);
    await this.recordAttempt(dto.username, user.id, true, null, context);

    const tokens = await this.tokenService.issuePair(user, context);
    this.logger.log(`Sign-in: ${user.username} (${user.role})`);

    return { user, tokens };
  }

  /* -------------------------------------------------------------- refresh */

  /**
   * Exchanges a refresh token for a new pair.
   *
   * The account is re-checked on every refresh, so deactivating a user ends
   * their access at the next rotation at the latest — a 7-day refresh token
   * does not outlive the account it belongs to.
   */
  async refresh(
    rawRefreshToken: string,
    userId: string,
    context: TokenContext,
  ): Promise<LoginResult> {
    const user = await this.usersService.findByIdForAuthentication(userId);

    if (!user || !user.isActive) {
      await this.tokenService.revoke(rawRefreshToken, 'admin');
      throw new AccountInactiveException();
    }

    const tokens = await this.tokenService.rotate(rawRefreshToken, user, context);
    return { user, tokens };
  }

  /* --------------------------------------------------------------- logout */

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) await this.tokenService.revoke(rawRefreshToken, 'logout');
  }

  async logoutEverywhere(userId: string): Promise<number> {
    return this.tokenService.revokeAllForUser(userId, 'logout-all');
  }

  /* ------------------------------------------------------ change password */

  /**
   * Changes the caller's own password and ends every other session.
   *
   * Revoking all refresh tokens is the point of the operation as much as the
   * new hash is: someone changing their password after a suspected compromise
   * expects it to evict whoever else is signed in. `passwordChangedAt` also
   * invalidates every outstanding access token, so the eviction is immediate
   * rather than delayed by up to the access-token lifetime.
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findByIdForAuthentication(userId);
    if (!user) throw new InvalidCredentialsException();

    const currentMatches = await this.passwordService.verify(
      user.passwordHash,
      dto.currentPassword,
    );
    if (!currentMatches) throw new InvalidCredentialsException();

    if (await this.passwordService.verify(user.passwordHash, dto.newPassword)) {
      throw new InvalidCredentialsException();
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.usersService.updatePassword(user.id, passwordHash, new Date());
    await this.tokenService.revokeAllForUser(user.id, 'password-changed');

    this.logger.log(`Password changed for ${user.username}; all sessions revoked.`);
  }

  /* ------------------------------------------------------------- internals */

  /**
   * Increments the failure counter and locks the account once the threshold is
   * reached inside the window.
   *
   * The count comes from the login_attempts table rather than the counter on
   * the user row, so it is genuinely windowed: five failures spread over a
   * month should not lock an account, and the persistent counter cannot be
   * reset by a single success months apart.
   */
  private async registerFailure(
    user: User,
    username: string,
    context: TokenContext,
  ): Promise<void> {
    const since = new Date(Date.now() - this.attemptWindowMs);
    const recentFailures = await this.loginAttemptRepository.countRecentFailures(username, since);

    // +1 for the failure being recorded now.
    const shouldLock = recentFailures + 1 >= this.maxAttempts;
    const lockUntil = shouldLock ? new Date(Date.now() + this.lockoutMs) : null;

    await this.usersService.recordFailedLogin(user.id, lockUntil);
    await this.recordAttempt(username, user.id, false, 'bad-password', context);

    if (shouldLock) {
      this.logger.warn(
        `Account ${user.username} locked after ${recentFailures + 1} failed attempts ` +
          `from ${context.ip ?? 'unknown ip'}.`,
      );
    }
  }

  /**
   * Audit rows must never break the request they describe — a failure to log
   * an attempt is a monitoring problem, not a reason to reject a valid
   * sign-in or to let an invalid one through.
   */
  private async recordAttempt(
    username: string,
    userId: string | null,
    successful: boolean,
    failureReason: LoginFailureReason | null,
    context: TokenContext,
  ): Promise<void> {
    try {
      await this.loginAttemptRepository.record({
        username,
        userId,
        successful,
        failureReason,
        ip: context.ip,
        userAgent: context.userAgent?.slice(0, 400) ?? null,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to record login attempt for '${username}': ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
