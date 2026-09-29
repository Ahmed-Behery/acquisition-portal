import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import type { AppConfig } from 'src/config/configuration';
import { TOKEN_TYPE } from 'src/config/constants';
import type { JwtPayload, JwtSignPayload } from 'src/common/types/jwt-payload';
import { TokenReuseException, UnauthenticatedException } from 'src/common/exceptions/app.exception';
import { ErrorCode } from 'src/common/exceptions/error-codes';
import type { User } from 'src/modules/users/entities/user.entity';
import {
  RefreshTokenRepository,
  type RevocationReason,
} from '../repositories/refresh-token.repository';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime, seconds. */
  expiresIn: number;
  /** Refresh-cookie lifetime, milliseconds. */
  refreshMaxAgeMs: number;
}

export interface TokenContext {
  ip: string | null;
  userAgent: string | null;
}

/** Parses '15m' / '7d' / '3600' into seconds. */
function parseDuration(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: '${value}'. Use forms like '15m', '7d', '3600'.`);

  const amount = Number.parseInt(match[1], 10);
  const multiplier = { s: 1, m: 60, h: 3600, d: 86_400 }[match[2] ?? 's'] ?? 1;
  return amount * multiplier;
}

/**
 * Issues, rotates and revokes tokens.
 *
 * The refresh scheme is rotation with reuse detection:
 *
 *  · signing in starts a *family* and issues the first refresh token;
 *  · each refresh revokes the presented token and issues a successor in the
 *    same family, so a token is valid exactly once;
 *  · presenting an already-revoked token means the credential was captured
 *    (or a client is replaying), so the whole family is revoked and the user
 *    must sign in again.
 *
 * That last step is what bounds the damage: a stolen refresh token buys an
 * attacker one refresh cycle, and using it locks both parties out rather than
 * granting silent long-term access.
 *
 * Only the SHA-256 digest of each token is stored. SHA-256 is correct here and
 * would be wrong for a password: these tokens are 256 bits of CSPRNG output,
 * so there is nothing to brute-force and no need for a slow KDF.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    configService: ConfigService<AppConfig, true>,
  ) {
    const jwt = configService.get('jwt', { infer: true });
    this.accessTtlSeconds = parseDuration(jwt.accessTtl);
    this.refreshTtlSeconds = parseDuration(jwt.refreshTtl);
    this.issuer = jwt.issuer;
    this.audience = jwt.audience;
    this.accessSecret = jwt.accessSecret;
    this.refreshSecret = jwt.refreshSecret;
  }

  /* ---------------------------------------------------------------- issue */

  /** Starts a new token family. Called on sign-in. */
  async issuePair(user: User, context: TokenContext): Promise<TokenPair> {
    return this.mint(user, randomUUID(), context);
  }

  /* --------------------------------------------------------------- rotate */

  /**
   * Exchanges a refresh token for a new pair.
   *
   * Verification order matters: signature and claims first (cheap, and rejects
   * garbage without a database round-trip), then the stored row, then its
   * state. Only a token that is present, unrevoked and unexpired is honoured.
   */
  async rotate(rawToken: string, user: User, context: TokenContext): Promise<TokenPair> {
    const payload = await this.verifyRefreshSignature(rawToken);
    const stored = await this.refreshTokenRepository.findByHash(this.digest(rawToken));

    if (!stored) {
      // Correctly signed but unknown to us: the row was purged, or the token
      // was minted with a leaked secret. Neither is safe to honour.
      throw new UnauthenticatedException(
        ErrorCode.TOKEN_INVALID,
        'Refresh token is not recognised.',
      );
    }

    if (stored.revokedAt !== null) {
      // Reuse detection. Revoking the family turns a stolen token into a
      // detected incident instead of silent persistent access.
      const revoked = await this.refreshTokenRepository.revokeFamily(
        stored.familyId,
        'reuse-detected',
      );
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId}; revoked ${revoked} token(s) ` +
          `in family ${stored.familyId}.`,
      );
      throw new TokenReuseException();
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthenticatedException(ErrorCode.TOKEN_EXPIRED, 'Refresh token has expired.');
    }

    if (stored.userId !== user.id || payload.sub !== user.id) {
      // Token/subject mismatch should be impossible; treat it as hostile.
      await this.refreshTokenRepository.revokeFamily(stored.familyId, 'reuse-detected');
      throw new TokenReuseException();
    }

    const pair = await this.mint(user, stored.familyId, context);

    // Retire the presented token last, and link it to its successor so the
    // family reads as an ordered chain during an investigation.
    const successor = await this.refreshTokenRepository.findByHash(this.digest(pair.refreshToken));
    await this.refreshTokenRepository.revoke(stored.id, 'rotated', successor?.id);

    return pair;
  }

  /* --------------------------------------------------------------- revoke */

  /** Revokes a single token. Used by sign-out; never throws on an unknown token. */
  async revoke(rawToken: string, reason: RevocationReason = 'logout'): Promise<void> {
    const stored = await this.refreshTokenRepository.findByHash(this.digest(rawToken));
    if (stored && stored.revokedAt === null) {
      await this.refreshTokenRepository.revoke(stored.id, reason);
    }
  }

  /** Revokes every live token for a user — sign out everywhere, or after a password change. */
  async revokeAllForUser(userId: string, reason: RevocationReason): Promise<number> {
    const count = await this.refreshTokenRepository.revokeAllForUser(userId, reason);
    if (count > 0)
      this.logger.log(`Revoked ${count} refresh token(s) for user ${userId}: ${reason}`);
    return count;
  }

  countActiveSessions(userId: string): Promise<number> {
    return this.refreshTokenRepository.countActiveForUser(userId);
  }

  /* -------------------------------------------------------------- internals */

  private async mint(user: User, familyId: string, context: TokenContext): Promise<TokenPair> {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const accessPayload: JwtSignPayload = {
      sub: user.id,
      typ: TOKEN_TYPE.ACCESS,
      jti: accessJti,
      role: user.role,
    };
    const refreshPayload: JwtSignPayload = {
      sub: user.id,
      typ: TOKEN_TYPE.REFRESH,
      jti: refreshJti,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessTtlSeconds,
        issuer: this.issuer,
        audience: this.audience,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtlSeconds,
        issuer: this.issuer,
        audience: this.audience,
      }),
    ]);

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: this.digest(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
      ip: context.ip,
      // Bounded: the column is varchar(400) and a User-Agent is attacker-controlled.
      userAgent: context.userAgent?.slice(0, 400) ?? null,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSeconds,
      refreshMaxAgeMs: this.refreshTtlSeconds * 1000,
    };
  }

  /**
   * Verifies signature, expiry, issuer, audience — and token type.
   *
   * The type check is the one that is easy to omit and expensive to miss:
   * without it an access token, which the client holds in readable memory and
   * sends on every request, could be exchanged for a fresh long-lived pair.
   */
  private async verifyRefreshSignature(rawToken: string): Promise<JwtPayload> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(rawToken, {
        secret: this.refreshSecret,
        issuer: this.issuer,
        audience: this.audience,
      });
    } catch {
      throw new UnauthenticatedException(ErrorCode.TOKEN_INVALID, 'Refresh token is not valid.');
    }

    if (payload.typ !== TOKEN_TYPE.REFRESH) {
      this.logger.warn(`Token of type '${payload.typ}' presented at the refresh endpoint.`);
      throw new UnauthenticatedException(ErrorCode.TOKEN_INVALID, 'Refresh token is not valid.');
    }

    return payload;
  }

  private digest(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
