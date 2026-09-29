import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import type { AppConfig } from 'src/config/configuration';
import { REFRESH_COOKIE_PATH, REFRESH_TOKEN_COOKIE } from 'src/config/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import type { AuthenticatedUser } from 'src/common/types/authenticated-request';
import { UnauthenticatedException } from 'src/common/exceptions/app.exception';
import { UserResponseDto } from 'src/modules/users/dtos/user-response.dto';
import { UsersService } from 'src/modules/users/services/users.service';
import { AuthService } from '../services/auth.service';
import { TokenService, type TokenContext } from '../services/token.service';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshDto } from '../dtos/refresh.dto';

/**
 * Authentication endpoints.
 *
 * | Route                     | Auth                    | Rate limit        |
 * |---------------------------|-------------------------|-------------------|
 * | `POST  /auth/login`       | public                  | 10 / 5 min per IP |
 * | `POST  /auth/refresh`     | refresh cookie or body  | 10 / 5 min per IP |
 * | `POST  /auth/logout`      | public (idempotent)     | default           |
 * | `POST  /auth/logout-all`  | access token            | default           |
 * | `GET   /auth/me`          | access token            | default           |
 * | `GET   /auth/sessions`    | access token            | default           |
 * | `PATCH /auth/password`    | access token            | default           |
 *
 * The controller owns cookie mechanics because a cookie is an HTTP transport
 * detail; AuthService deals only in tokens and never sees a request or a
 * response object (architecture rule 7).
 */
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /* ---------------------------------------------------------------- login */

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Tighter than the global bucket. Credential stuffing is a volume attack, and
  // the account lockout alone would let an attacker lock out every known user.
  @Throttle({ auth: { limit: 10, ttl: 300_000 } })
  @ApiOperation({
    summary: 'Sign in',
    description:
      'Returns an access token in the body and sets the refresh token as an HttpOnly ' +
      'cookie. Failures are deliberately indistinguishable: an unknown username and a ' +
      'wrong password produce the same response, in the same time.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'INVALID_CREDENTIALS — username or password is wrong.' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded.' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { user, tokens } = await this.authService.login(dto, this.contextOf(request));

    this.setRefreshCookie(response, tokens.refreshToken, tokens.refreshMaxAgeMs);
    return new AuthResponseDto(tokens.accessToken, tokens.expiresIn, user);
  }

  /* -------------------------------------------------------------- refresh */

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 300_000 } })
  @ApiOperation({
    summary: 'Exchange a refresh token for a new access token',
    description:
      'Rotates the refresh token: the presented one is revoked and a successor issued. ' +
      'Presenting an already-used token is treated as theft — the whole token family is ' +
      'revoked and the user must sign in again.',
  })
  @ApiBody({ type: RefreshDto, required: false })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token missing, invalid, expired, or reused.' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const rawToken = this.extractRefreshToken(request, dto);
    if (!rawToken) throw new UnauthenticatedException();

    // The subject is read from the token itself inside TokenService, which
    // verifies the signature first; decoding here only selects which user row
    // to load, and every claim is re-verified before anything is issued.
    const userId = this.subjectOf(rawToken);
    const { user, tokens } = await this.authService.refresh(
      rawToken,
      userId,
      this.contextOf(request),
    );

    this.setRefreshCookie(response, tokens.refreshToken, tokens.refreshMaxAgeMs);
    return new AuthResponseDto(tokens.accessToken, tokens.expiresIn, user);
  }

  /* --------------------------------------------------------------- logout */

  /**
   * Public and idempotent on purpose: signing out must work even when the
   * access token has already expired, which is exactly when a user reaches for
   * it. The refresh cookie is the credential being revoked, so nothing else is
   * needed, and an unknown token is a no-op rather than an error.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Sign out of this session' })
  async logout(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(this.extractRefreshToken(request, dto));
    this.clearRefreshCookie(response);
  }

  @Post('logout-all')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign out of every session',
    description: 'Revokes every refresh token for the caller, on all devices.',
  })
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ revokedSessions: number }> {
    const revokedSessions = await this.authService.logoutEverywhere(userId);
    this.clearRefreshCookie(response);
    return { revokedSessions };
  }

  /* ------------------------------------------------------------------- me */

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the signed-in user',
    description:
      'The authoritative source for profile data. Name, email and company are ' +
      'deliberately absent from the JWT — a signed token is readable by anyone holding it.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.usersService.findById(userId));
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Count the caller's active sessions" })
  async sessions(@CurrentUser('id') userId: string): Promise<{ activeSessions: number }> {
    return { activeSessions: await this.tokenService.countActiveSessions(userId) };
  }

  /* ----------------------------------------------------- change password */

  @Patch('password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change your own password',
    description:
      'Requires the current password even though you are signed in — that is what stops ' +
      'an unattended session being used to seize the account. Every other session is ' +
      'revoked, and outstanding access tokens stop working immediately.',
  })
  @ApiUnauthorizedResponse({ description: 'Current password is wrong, or the new one repeats it.' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.changePassword(user.id, dto);
    // Every refresh token including this browser's was revoked; clearing the
    // cookie avoids a pointless 401 on the next refresh.
    this.clearRefreshCookie(response);
  }

  /* ------------------------------------------------------------- internals */

  private contextOf(request: Request): TokenContext {
    return {
      // `req.ip` honours X-Forwarded-For only when TRUST_PROXY is enabled, so
      // the value cannot be spoofed by a client when the app is directly exposed.
      ip: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    };
  }

  /** Cookie wins over the body, so a browser cannot be tricked into using an attacker's token. */
  private extractRefreshToken(request: Request, dto: RefreshDto): string | undefined {
    const cookies = request.cookies as Record<string, string | undefined> | undefined;
    return cookies?.[REFRESH_TOKEN_COOKIE] ?? dto.refreshToken;
  }

  /**
   * Reads `sub` without verifying — safe only because TokenService verifies
   * the signature, issuer, audience, expiry and token type before honouring
   * anything, and re-checks that `sub` matches the stored row's user.
   */
  private subjectOf(rawToken: string): string {
    try {
      const payload = rawToken.split('.')[1];
      if (!payload) throw new Error('malformed');
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
        sub?: unknown;
      };
      if (typeof decoded.sub !== 'string') throw new Error('no subject');
      return decoded.sub;
    } catch {
      throw new UnauthenticatedException();
    }
  }

  private refreshCookieOptions(): CookieOptions {
    const cookie = this.configService.get('cookie', { infer: true });

    return {
      httpOnly: true,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      // Scoped to the auth routes, so it is not attached to ordinary API calls.
      path: REFRESH_COOKIE_PATH,
      ...(cookie.domain ? { domain: cookie.domain } : {}),
    };
  }

  private setRefreshCookie(response: Response, token: string, maxAgeMs: number): void {
    response.cookie(REFRESH_TOKEN_COOKIE, token, {
      ...this.refreshCookieOptions(),
      maxAge: maxAgeMs,
    });
  }

  private clearRefreshCookie(response: Response): void {
    // Attributes must match those used when setting it, or the browser keeps
    // the original cookie.
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.refreshCookieOptions());
  }
}
