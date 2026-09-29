import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/modules/users/dtos/user-response.dto';
import type { User } from 'src/modules/users/entities/user.entity';

/**
 * Sign-in and refresh response.
 *
 * The access token is returned in the body for the SPA to hold in memory —
 * not in a cookie, because a cookie is attached automatically to every request
 * and would need CSRF defences of its own. The refresh token is NOT here: it
 * is set as an HttpOnly cookie by the controller and is never readable by page
 * JavaScript.
 *
 * The split is deliberate. An XSS flaw can steal whatever the page can read;
 * making that the 15-minute access token rather than the 7-day refresh token
 * is the difference between a short window and a persistent foothold.
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'Bearer token. Hold in memory; do not persist to storage.' })
  readonly accessToken: string;

  @ApiProperty({ example: 900, description: 'Access-token lifetime in seconds.' })
  readonly expiresIn: number;

  @ApiProperty({ example: 'Bearer' })
  readonly tokenType = 'Bearer';

  @ApiProperty({ type: UserResponseDto })
  readonly user: UserResponseDto;

  @ApiProperty({
    description:
      'When true, every endpoint except PATCH /auth/password returns 403 until the ' +
      'password is changed.',
  })
  readonly mustChangePassword: boolean;

  constructor(accessToken: string, expiresIn: number, user: User) {
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.user = UserResponseDto.from(user);
    this.mustChangePassword = user.mustChangePassword;
  }
}
