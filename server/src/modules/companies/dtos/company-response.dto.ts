import { ApiProperty } from '@nestjs/swagger';
import type { Company } from '../entities/company.entity';

/**
 * Outbound shape for a company.
 *
 * Explicit mapping rather than returning the entity. Serialising entities
 * directly means every column added later is published to clients by default —
 * the mistake that leaks a password hash or an internal flag. Here, a new
 * column is invisible until someone adds it to this class on purpose.
 */
export class CompanyResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id: string;

  @ApiProperty({
    example: 'FACT',
    description: 'Reference prefix for merchant and pipeline codes.',
  })
  readonly code: string;

  @ApiProperty({ example: 'Contact Factoring' })
  readonly name: string;

  @ApiProperty({ nullable: true, example: 'Invoice factoring, receivables financing' })
  readonly focus: string | null;

  @ApiProperty()
  readonly isActive: boolean;

  private constructor(company: Company) {
    this.id = company.id;
    this.code = company.code;
    this.name = company.name;
    this.focus = company.focus;
    this.isActive = company.isActive;
  }

  static from(company: Company): CompanyResponseDto {
    return new CompanyResponseDto(company);
  }

  static fromMany(companies: Company[]): CompanyResponseDto[] {
    return companies.map((company) => CompanyResponseDto.from(company));
  }
}
