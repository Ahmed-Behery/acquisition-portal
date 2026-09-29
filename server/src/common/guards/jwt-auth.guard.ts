import { Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError, JsonWebTokenError } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from 'src/config/constants';
import { ErrorCode } from '../exceptions/error-codes';
import { UnauthenticatedException } from '../exceptions/app.exception';

/**
 * Global authentication guard.
 *
 * Registered as an APP_GUARD, so every route is protected unless it carries
 * `@Public()`. Default-deny is the whole point (section 5): forgetting a guard
 * on a new controller must fail closed, not open.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context);
  }

  /**
   * Translates passport's outcome into our error vocabulary.
   *
   * The distinction between "expired" and "invalid" is deliberate and safe to
   * disclose: the client needs TOKEN_EXPIRED to know it should attempt a
   * silent refresh rather than bounce the user to the login screen. Nothing
   * here reveals whether an account exists.
   */
  override handleRequest<TUser>(err: unknown, user: TUser | false, info: unknown): TUser {
    // passport hands back whatever the strategy threw, typed `unknown`.
    // Our own exceptions pass straight through; anything else is normalised so
    // a non-Error value cannot escape as an unhandled throw.
    if (err) throw err instanceof Error ? err : new UnauthenticatedException();

    if (!user) {
      if (info instanceof TokenExpiredError) {
        throw new UnauthenticatedException(ErrorCode.TOKEN_EXPIRED, 'Access token has expired.');
      }
      if (info instanceof JsonWebTokenError) {
        throw new UnauthenticatedException(ErrorCode.TOKEN_INVALID, 'Access token is not valid.');
      }
      throw new UnauthenticatedException();
    }

    return user;
  }
}
