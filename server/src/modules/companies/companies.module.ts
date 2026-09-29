import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesController } from './controllers/companies.controller';
import { CompaniesRepository } from './repositories/companies.repository';
import { CompaniesService } from './services/companies.service';

/**
 * Only CompaniesService is exported. The repository and the entity stay
 * private to the module, which is what makes the boundary rule enforceable
 * rather than merely documented — an outside module that tries to inject
 * CompaniesRepository fails at container build time.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesRepository],
  exports: [CompaniesService],
})
export class CompaniesModule {}
