import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseBoolPipe } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import { CompaniesService } from '../services/companies.service';
import { CompanyResponseDto } from '../dtos/company-response.dto';

/**
 * Group companies — reference data.
 *
 * Read-only over HTTP. The seven companies change only when the group
 * restructures, which is a migration and a deployment, not an API call; there
 * is no write endpoint to secure or to get wrong.
 *
 * **Auth:** every route requires a valid access token. Any authenticated role
 * may read: the company list populates dropdowns on screens all six roles use.
 */
@ApiTags('companies')
@ApiBearerAuth()
@Controller({ path: 'companies', version: '1' })
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({
    summary: 'List group companies',
    description: 'Returns the active Contact Group companies, ordered for display.',
  })
  @ApiOkResponse({ type: CompanyResponseDto, isArray: true })
  async findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ): Promise<CompanyResponseDto[]> {
    const companies = await this.companiesService.findAll(includeInactive ?? false);
    return CompanyResponseDto.fromMany(companies);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one company by id' })
  @ApiOkResponse({ type: CompanyResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CompanyResponseDto> {
    return CompanyResponseDto.from(await this.companiesService.findById(id));
  }

  /**
   * Included to make the inactive-company case reachable for Admin tooling
   * without adding a write surface.
   */
  @Get('code/:code')
  @Roles(UserRole.ADMIN, UserRole.HEAD_OF_PRODUCTS)
  @ApiOperation({
    summary: 'Get one company by its reference code',
    description: 'Admin and Head of Products only.',
  })
  @ApiOkResponse({ type: CompanyResponseDto })
  async findByCode(@Param('code') code: string): Promise<CompanyResponseDto> {
    return CompanyResponseDto.from(await this.companiesService.findByCode(code));
  }
}
