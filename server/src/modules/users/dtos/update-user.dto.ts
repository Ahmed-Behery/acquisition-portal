import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

/**
 * Administrator edit of an existing account.
 *
 * `username` is omitted deliberately: it is the identity every audit row and
 * every historic notification refers to. Allowing it to change would silently
 * rewrite the meaning of records already written. A user who needs a different
 * username gets a new account and the old one is deactivated.
 *
 * `role` and `companyId` remain editable — people move between departments —
 * but UsersService re-checks the RM-requires-company invariant on every
 * update, and the database CHECK constraint backs it up.
 */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['username'] as const)) {
  @ApiPropertyOptional({
    description:
      'Expected current version, for optimistic locking. When supplied and stale, the ' +
      'request fails with 409 VERSION_CONFLICT instead of silently overwriting a ' +
      'concurrent edit. Omit only for a deliberate last-write-wins update.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;
}
