import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Refresh request body.
 *
 * Normally empty: the refresh token travels in the HttpOnly `cap_refresh`
 * cookie, where JavaScript on the page cannot read it, so an XSS flaw cannot
 * exfiltrate a long-lived credential.
 *
 * The body field exists as a fallback for non-browser clients and for trying
 * the endpoint in Swagger UI, which cannot set the cookie. The cookie takes
 * precedence when both are present.
 */
export class RefreshDto {
  @ApiPropertyOptional({
    description:
      'Refresh token. Omit in browsers — the HttpOnly cookie is used automatically ' +
      'and takes precedence over this field.',
  })
  @IsString()
  @MaxLength(2048)
  @IsOptional()
  refreshToken?: string;
}
