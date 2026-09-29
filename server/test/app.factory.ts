import { Test } from '@nestjs/testing';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { PasswordService } from 'src/modules/password/services/password.service';
import { User } from 'src/modules/users/entities/user.entity';
import { Company } from 'src/modules/companies/entities/company.entity';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

/**
 * Boots the real application for end-to-end tests.
 *
 * Mirrors main.ts for everything that affects behaviour under test — the
 * global prefix, URI versioning, the ValidationPipe settings and cookie
 * parsing. A test harness that configures these differently from production
 * proves nothing about production, and `whitelist`/`forbidNonWhitelisted` in
 * particular are the settings most worth exercising.
 *
 * Omitted deliberately: helmet, CORS and compression. They are HTTP-edge
 * concerns verified by configuration review, and they add noise to assertions
 * here.
 */
export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication({ logger: false });

  app.setGlobalPrefix('api', { exclude: ['health/live', 'health/ready'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(cookieParser('e2e-cookie-secret-value-at-least-32-characters-long'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
      validationError: { target: false, value: false },
    }),
  );

  await app.init();

  const dataSource = app.get(DataSource);

  // Schema comes from the migrations, never from `synchronize` — so the suite
  // exercises the same DDL that will run against production. A migration that
  // is wrong fails here rather than on deployment night.
  await dataSource.runMigrations();

  return { app, dataSource };
}

/** Empties the tables between tests, leaving the schema in place. */
export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    'TRUNCATE TABLE "login_attempts", "refresh_tokens", "users", "companies" RESTART IDENTITY CASCADE',
  );
}

export interface SeededUser {
  user: User;
  password: string;
}

/** Creates a company and a user with a known password. */
export async function seedUser(
  context: TestContext,
  overrides: Partial<User> = {},
  password = 'Correct-Horse-1!',
): Promise<SeededUser> {
  const { app, dataSource } = context;
  const companyRepository = dataSource.getRepository(Company);
  const userRepository = dataSource.getRepository(User);

  let company = await companyRepository.findOne({ where: { code: 'FACT' } });
  company ??= await companyRepository.save(
    companyRepository.create({ code: 'FACT', name: 'Contact Factoring', sortOrder: 1 }),
  );

  const passwordHash = await app.get(PasswordService).hash(password);

  const user = await userRepository.save(
    userRepository.create({
      username: 'y.fahmy',
      email: 'y.fahmy@contact.eg',
      name: 'Youssef Fahmy',
      role: UserRole.RM,
      companyId: company.id,
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      ...overrides,
    }),
  );

  return { user, password };
}
