import 'reflect-metadata';
import dataSource from '../data-source';
import { seedAdminUser } from './admin-user.seed';
import { seedCompanies } from './companies.seed';

/**
 * Seed runner — `npm run seed`.
 *
 * Every seed is idempotent, so this is safe to run on each deploy: it brings
 * reference data up to date without touching operational records. It does NOT
 * run migrations; schema and data are separate concerns and separate commands.
 *
 * Exits non-zero on failure so a deployment pipeline halts rather than
 * continuing against a half-seeded database.
 */
async function run(): Promise<void> {
  console.log(`Seeding database '${dataSource.options.database as string}'...`);

  await dataSource.initialize();

  try {
    const pending = await dataSource.showMigrations();
    if (pending) {
      throw new Error('There are pending migrations. Run `npm run migration:run` before seeding.');
    }

    await seedCompanies(dataSource);
    await seedAdminUser(dataSource);

    console.log('Seeding complete.');
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error('Seeding failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
