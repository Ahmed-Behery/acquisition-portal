import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsStrongPassword } from 'src/common/validators/is-strong-password.validator';

/**
 * Change one's own password.
 *
 * `currentPassword` is required even though the caller is already
 * authenticated: it is what stops an unattended session, or a stolen access
 * token, from being used to seize the account permanently. Re-authentication
 * before a credential change is the standard control.
 *
 * There is no `confirmPassword`. Confirmation is a client-side typo guard; the
 * server has nothing to do with it, and accepting it would mean a second copy
 * of the secret in the request body and in any logs that slipped through
 * redaction.
 */
export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({
    description:
      '12-128 characters, with a lowercase letter, an uppercase letter, a number and a symbol.',
  })
  @IsStrongPassword()
  newPassword!: string;
}
