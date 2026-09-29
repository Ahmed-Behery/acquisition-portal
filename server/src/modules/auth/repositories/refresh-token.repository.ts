import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

/** Reasons a token row is retired. Recorded so a session's end is explicable. */
export type RevocationReason =
  'rotated' | 'logout' | 'logout-all' | 'reuse-detected' | 'password-changed' | 'admin';

/**
 * Persistence for refresh tokens. Owned by AuthModule.
 *
 * Rows are marked revoked, never deleted, so the history of a session survives
 * for investigation. Physical removal is the cleanup job's job, and only for
 * rows well past expiry.
 */
@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>,
  ) {}

  create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    return this.repository.save(this.repository.create(data));
  }

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { tokenHash } });
  }

  async revoke(id: string, reason: RevocationReason, replacedById?: string): Promise<void> {
    await this.repository.update(
      { id, revokedAt: IsNull() },
      { revokedAt: new Date(), revokedReason: reason, replacedById: replacedById ?? null },
    );
  }

  /**
   * Revokes every live token descended from one login.
   *
   * Called on reuse detection. A presented token that is already revoked means
   * either a stolen credential or a client replaying an old one; neither is
   * safe to continue, so the entire family goes at once and the user signs in
   * again.
   */
  async revokeFamily(familyId: string, reason: RevocationReason): Promise<number> {
    const result = await this.repository.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date(), revokedReason: reason },
    );
    return result.affected ?? 0;
  }

  /** Revokes every live token for a user — "sign out everywhere". */
  async revokeAllForUser(userId: string, reason: RevocationReason): Promise<number> {
    const result = await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date(), revokedReason: reason },
    );
    return result.affected ?? 0;
  }

  countActiveForUser(userId: string): Promise<number> {
    return this.repository.count({ where: { userId, revokedAt: IsNull() } });
  }

  /**
   * Physically removes rows that expired before `before`.
   *
   * Retention, not correctness: revoked and expired tokens are already
   * unusable. Kept for a window so an incident review can still see them.
   */
  async deleteExpiredBefore(before: Date): Promise<number> {
    const result = await this.repository.delete({ expiresAt: LessThan(before) });
    return result.affected ?? 0;
  }
}
