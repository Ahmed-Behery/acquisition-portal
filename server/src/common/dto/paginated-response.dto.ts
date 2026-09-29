import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 }) readonly page!: number;
  @ApiProperty({ example: 25 }) readonly limit!: number;
  @ApiProperty({ example: 137 }) readonly total!: number;
  @ApiProperty({ example: 6 }) readonly totalPages!: number;
  @ApiProperty({ example: true }) readonly hasNextPage!: boolean;
  @ApiProperty({ example: false }) readonly hasPreviousPage!: boolean;
}

/**
 * Envelope for every list endpoint.
 *
 * Returning a bare array is convenient right up to the point where the
 * response needs a total, and then it is a breaking change. The envelope is
 * cheap now and avoids that.
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  readonly data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  readonly meta: PaginationMetaDto;

  constructor(data: T[], total: number, page: number, limit: number) {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    this.data = data;
    this.meta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
