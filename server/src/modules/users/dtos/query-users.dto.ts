import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ToOptionalBoolean } from 'src/common/transforms';
import { UserGroup } from '../enums/user-group.enum';
import { UserRole } from '../enums/user-role.enum';

/**
 * Sortable columns.
 *
 * A closed union, not a free string. `sortBy` becomes a SQL identifier in an
 * ORDER BY clause, and identifiers cannot be parameterised — so the allowlist
 * is the only thing standing between this parameter and SQL injection. The
 * repository maps these keys to column names and never interpolates the raw
 * input.
 */
export const USER_SORT_FIELDS = [
  'name',
  'username',
  'email',
  'role',
  'createdAt',
  'lastLoginAt',
] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: USER_SORT_FIELDS, default: 'createdAt' })
  @IsIn(USER_SORT_FIELDS)
  @IsOptional()
  sortBy: UserSortField = 'createdAt';

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserGroup })
  @IsEnum(UserGroup)
  @IsOptional()
  group?: UserGroup;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by activation state. Omit to return both.' })
  @ToOptionalBoolean()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
