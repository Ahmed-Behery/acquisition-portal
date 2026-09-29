import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { TrimLowercase } from 'src/common/transforms';

/**
 * Sign-in credentials.
 *
 * Note what is absent: `@IsStrongPassword`, `@Matches`, any format rule beyond
 * a length bound. Validating the *shape* of a submitted password at sign-in
 * tells an attacker which candidates are worth trying and leaks the policy to
 * anyone who can reach the endpoint. The only job here is to bound the input
 * so an enormous body cannot be used to burn Argon2 CPU time.
 */
export class LoginDto {
  @ApiProperty({ example: 'y.fahmy' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @TrimLowercase()
  username!: string;

  @ApiProperty({ example: 'CorrectHorseBattery1!' })
  @IsString()
  @MinLength(1)
  // Bounded so a multi-megabyte string cannot be fed to the hash function.
  @MaxLength(128)
  password!: string;
}
