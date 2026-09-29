import type { TokenType } from 'src/config/constants';

/**
 * JWT claims.
 *
 * Deliberately minimal — section 4 of the spec forbids sensitive data in the
 * payload, and a JWT is signed, not encrypted: anyone holding the token can
 * read every claim. Name, email, company and job title are therefore absent;
 * consumers that need them call GET /auth/me.
 *
 * `role` is carried only so that logs and metrics can attribute a request
 * without a database round-trip. It is NEVER the basis of an authorization
 * decision: JwtStrategy re-reads the user on every request, so a role change
 * or deactivation takes effect immediately rather than at token expiry.
 */
export interface JwtPayload {
  /** Subject — the user id. */
  sub: string;
  /** Token discriminator; prevents an access token being replayed as a refresh token. */
  typ: TokenType;
  /** Unique token id. For refresh tokens this is the row id in refresh_tokens. */
  jti: string;
  /** Advisory only — see the note above. */
  role: string;
  /** Issued-at, seconds since epoch. Compared against users.password_changed_at. */
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

/** The subset supplied when signing; the rest is filled in by @nestjs/jwt. */
export type JwtSignPayload = Pick<JwtPayload, 'sub' | 'typ' | 'jti' | 'role'>;
