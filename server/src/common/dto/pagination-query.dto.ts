import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PAGINATION } from 'src/config/constants';

/**
 * Shared pagination, sorting and search parameters.
 *
 * `limit` is capped server-side. A client-controlled, uncapped page size is
 * how a read endpoint becomes a denial-of-service vector — and it is the
 * reason every list endpoint here is paginated by default rather than
 * returning a whole table.
 *
 * Concrete query DTOs extend this and declare their own `sortBy` union; the
 * repository must validate the column against an allowlist before it reaches
 * an ORDER BY clause, since a sort column is a SQL identifier and cannot be
 * parameterised.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: PAGINATION.DEFAULT_PAGE,
    description: '1-based page number.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: PAGINATION.MAX_LIMIT,
    default: PAGINATION.DEFAULT_LIMIT,
    description: `Items per page. Capped at ${PAGINATION.MAX_LIMIT}.`,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_LIMIT)
  @IsOptional()
  limit: number = PAGINATION.DEFAULT_LIMIT;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ maxLength: 200, description: 'Free-text search term.' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  search?: string;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
