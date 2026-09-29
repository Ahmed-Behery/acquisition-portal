import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim, TrimLowercase } from 'src/common/transforms';
import { UserGroup } from '../enums/user-group.enum';
import { UserRole } from '../enums/user-role.enum';

/**
 * Administrator-created account.
 *
 * There is no self-registration endpoint in this starter, by design. The
 * legacy application let anyone with the URL create an `RM` account for
 * themselves and be signed in immediately; an account in a system holding
 * deal values and client contact details is an administrative act.
 *
 * No password field: the administrator does not choose it. The API generates
 * a single-use credential, returns it once, and flags the account
 * `must_change_password`. That avoids the two failure modes of the legacy
 * design — a shared default password, and an administrator who knows every
 * user's credential.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'y.fahmy', minLength: 3, maxLength: 50 })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'username may contain only letters, digits, dot, underscore and hyphen',
  })
  @TrimLowercase()
  username!: string;

  @ApiProperty({ example: 'y.fahmy@contact.eg', maxLength: 254 })
  @IsEmail({}, { message: 'email must be a valid address' })
  @MaxLength(254)
  @TrimLowercase()
  email!: string;

  @ApiProperty({ example: 'Youssef Fahmy', maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Trim()
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.RM })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    enum: UserGroup,
    description: 'Directory group. Drives notification audiences, not permissions.',
  })
  @IsEnum(UserGroup)
  @IsOptional()
  group?: UserGroup;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Required for the RM role; rejected for group-wide roles.',
  })
  @IsUUID('4')
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  @Trim()
  jobTitle?: string;

  @ApiPropertyOptional({ maxLength: 40, example: '+20 100 123 4567' })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  phone?: string;
}
