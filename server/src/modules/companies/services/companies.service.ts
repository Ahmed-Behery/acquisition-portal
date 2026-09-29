import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from 'src/common/exceptions/app.exception';
import { CompaniesRepository } from '../repositories/companies.repository';
import type { Company } from '../entities/company.entity';

/**
 * The public face of CompaniesModule.
 *
 * Other modules depend on this class, never on CompaniesRepository or on the
 * Company entity's repository — that boundary is what stops, say, a future
 * pipeline module inventing its own notion of which companies are valid.
 */
@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  findAll(includeInactive = false): Promise<Company[]> {
    return this.companiesRepository.findAll(includeInactive);
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companiesRepository.findById(id);
    if (!company) throw new ResourceNotFoundException('Company', id);
    return company;
  }

  async findByCode(code: string): Promise<Company> {
    const company = await this.companiesRepository.findByCode(code);
    if (!company) throw new ResourceNotFoundException('Company', code);
    return company;
  }

  /**
   * Cross-module contract used by UsersService to validate `companyId`.
   *
   * Returns a boolean rather than throwing so the caller decides how a bad id
   * surfaces — as a field-level validation error on a form, not as a bare 404
   * for a resource the user never asked for.
   */
  isActiveCompany(id: string): Promise<boolean> {
    return this.companiesRepository.existsActive(id);
  }
}
