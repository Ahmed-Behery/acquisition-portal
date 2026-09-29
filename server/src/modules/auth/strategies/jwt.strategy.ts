import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from 'src/config/configuration';
import { TOKEN_TYPE } from 'src/config/constants';
import type { JwtPayload } from 'src/common/types/jwt-payload';
import type { AuthenticatedUser } from 'src/common/types/authenticated-request';
import {
  AccountInactiveException,
  UnauthenticatedException,
} from 'src/common/exceptions/app.exception';
import { ErrorCode } from 'src/common/exceptions/error-codes';
import { UsersService } from 'src/modules/users/services/users.service';

/**
 * Access-token validation.
 *
 * passport-jwt has already checked the signature, expiry, issuer and audience
 * by the time `validate` runs — `secretOrKey`, `issuer` and `audience` below
 * are what make that happen, and omitting `issuer`/`audience` is the common
 * mistake that lets a token minted for another service be replayed here.
 *
 * This method then adds the three checks a stateless token cannot make for
 * itself:
 *
 *  1. **token type** — a refresh token must not work as a bearer credential;
 *  2. **account still exists and is active** — a deactivated user is refused
 *     on their very next request, not when their token happens to expire;
 *  3. **not issued before the last password change** — so changing a password
 *     evicts every other device immediately.
 *
 * The cost is one indexed primary-key lookup per request. That is the right
 * trade for a system holding financial records: the alternative is a window,
 * up to the full token lifetime, in which a revoked account still works.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService<AppConfig, true>,
  ) {
    const jwt = configService.get('jwt', { infer: true });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.accessSecret,
      issuer: jwt.issuer,
      audience: jwt.audience,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.typ !== TOKEN_TYPE.ACCESS) {
      throw new UnauthenticatedException(
        ErrorCode.TOKEN_INVALID,
        'This endpoint requires an access token.',
      );
    }

    const user = await this.usersService.findByIdForAuthentication(payload.sub);

    if (!user) {
      // Valid signature, no such user: the account was deleted after the token
      // was issued.
      throw new UnauthenticatedException(ErrorCode.TOKEN_INVALID, 'Access token is not valid.');
    }

    if (!user.isActive) throw new AccountInactiveException();

    if (user.passwordChangedAt) {
      // `iat` is in seconds; floor the stored timestamp the same way so a
      // token issued in the same second as the change is not spuriously
      // rejected.
      const changedAtSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (payload.iat < changedAtSeconds) {
        throw new UnauthenticatedException(
          ErrorCode.TOKEN_REVOKED,
          'This session ended when the password was changed. Please sign in again.',
        );
      }
    }

    // A flat principal, not the entity — so no controller can mutate and save
    // a user around UsersService.
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
