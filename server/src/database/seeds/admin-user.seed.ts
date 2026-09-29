import * as argon2 from 'argon2';
import type { DataSource } from 'typeorm';
import { configuration } from 'src/config/configuration';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

/**
 * Bootstrap administrator.
 *
 * Exactly one account is created, and only when no administrator exists yet —
 * this is the chicken-and-egg opener for a system where user creation is an
 * Admin-only endpoint. It is not a demo-account fixture: the legacy
 * application shipped 85 accounts sharing the password `Contact@123`, with six
 * of them printed on the login page, and none of that is carried forward.
 *
 * The account is flagged `must_change_password`, so the API refuses every
 * request other than "change my password" until the seeded credential has been
 * replaced.
 */
export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(User);

  const existingAdmin = await repository.findOne({ where: { role: UserRole.ADMIN } });
  if (existingAdmin) {
    console.log('  admin user: already present, skipped');
    return;
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const username = process.env.SEED_ADMIN_USERNAME;
  const name = process.env.SEED_ADMIN_NAME ?? 'Portal Administrator';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !username || !password) {
    console.warn(
      '  admin user: SKIPPED — set SEED_ADMIN_EMAIL, SEED_ADMIN_USERNAME and ' +
        'SEED_ADMIN_PASSWORD to create the bootstrap administrator.',
    );
    return;
  }

  const { password: passwordConfig } = configuration();

  if (password.length < passwordConfig.minLength) {
    throw new Error(
      `SEED_ADMIN_PASSWORD is shorter than PASSWORD_MIN_LENGTH (${passwordConfig.minLength}).`,
    );
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: passwordConfig.memoryKib,
    timeCost: passwordConfig.timeCost,
    parallelism: passwordConfig.parallelism,
  });

  await repository.save(
    repository.create({
      username,
      email,
      name,
      role: UserRole.ADMIN,
      group: null,
      companyId: null,
      jobTitle: 'Administrator',
      passwordHash,
      mustChangePassword: true,
      isActive: true,
    }),
  );

  console.log(`  admin user: created '${username}' (must change password on first sign-in)`);
}
