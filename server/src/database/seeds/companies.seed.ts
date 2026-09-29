import type { DataSource } from 'typeorm';
import { Company } from 'src/modules/companies/entities/company.entity';

/**
 * The seven Contact Group companies.
 *
 * Reference data, not sample data: these rows are required for the
 * application to function in every environment including production, because
 * a company code is the prefix of every merchant and pipeline reference.
 *
 * Idempotent — matched on `code`, so re-running updates names and focus text
 * without creating duplicates or disturbing the generated ids that existing
 * rows already reference.
 */
const COMPANIES: ReadonlyArray<Pick<Company, 'code' | 'name' | 'focus' | 'sortOrder'>> = [
  {
    code: 'FACT',
    name: 'Contact Factoring',
    focus: 'Invoice factoring, receivables financing, supplier finance',
    sortOrder: 1,
  },
  {
    code: 'LEASE',
    name: 'Contact Leasing',
    focus: 'Equipment, vehicle, and asset leasing for SMEs and corporates',
    sortOrder: 2,
  },
  {
    code: 'MORT',
    name: 'Contact Mortgage',
    focus: 'Residential and commercial mortgage financing',
    sortOrder: 3,
  },
  {
    code: 'CRED',
    name: 'Contact Credit',
    focus: 'Consumer credit and personal finance',
    sortOrder: 4,
  },
  {
    code: 'INS',
    name: 'Contact Insurance',
    focus: 'Insurance products and risk protection across the group',
    sortOrder: 5,
  },
  {
    code: 'MOTOR',
    name: 'Contact Auto',
    focus: 'Vehicle care, auto finance, and after-sales motor services',
    sortOrder: 6,
  },
  {
    code: 'NOW',
    name: 'Contact Now',
    focus: 'Consumer finance / buy-now-pay-later',
    sortOrder: 7,
  },
];

export async function seedCompanies(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(Company);
  let created = 0;
  let updated = 0;

  for (const definition of COMPANIES) {
    const existing = await repository.findOne({ where: { code: definition.code } });

    if (existing) {
      existing.name = definition.name;
      existing.focus = definition.focus;
      existing.sortOrder = definition.sortOrder;
      await repository.save(existing);
      updated += 1;
    } else {
      await repository.save(repository.create({ ...definition, isActive: true }));
      created += 1;
    }
  }

  console.log(`  companies: ${created} created, ${updated} updated`);
}
