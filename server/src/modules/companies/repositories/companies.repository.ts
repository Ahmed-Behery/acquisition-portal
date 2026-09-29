import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';

/**
 * Persistence for Company. Owned by CompaniesModule.
 *
 * Per the repository boundary rule, nothing outside this module injects this
 * class — other modules go through CompaniesService. Keeping it a thin,
 * query-only layer is deliberate: no business rules, no cross-entity
 * knowledge, nothing that would make it worth reaching around the service for.
 */
@Injectable()
export class CompaniesRepository {
  constructor(
    @InjectRepository(Company)
    private readonly repository: Repository<Company>,
  ) {}

  findAll(includeInactive = false): Promise<Company[]> {
    return this.repository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  findById(id: string): Promise<Company | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<Company | null> {
    return this.repository.findOne({ where: { code } });
  }

  /**
   * Existence check that avoids loading the row.
   *
   * Used on the hot path where UsersService validates a company id on every
   * create and update; `SELECT 1` beats hydrating an entity that is then
   * discarded.
   */
  existsActive(id: string): Promise<boolean> {
    return this.repository.exists({ where: { id, isActive: true } });
  }
}
