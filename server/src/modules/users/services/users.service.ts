import { Injectable, Logger } from '@nestjs/common';
import {
  AccessDeniedException,
  ResourceConflictException,
  ResourceNotFoundException,
  ValidationException,
  VersionConflictException,
} from 'src/common/exceptions/app.exception';
import { CompaniesService } from 'src/modules/companies/services/companies.service';
import { PasswordService } from 'src/modules/password/services/password.service';
import { UsersRepository } from '../repositories/users.repository';
import { User } from '../entities/user.entity';
import { LEADERSHIP_ROLES, UserRole } from '../enums/user-role.enum';
import type { CreateUserDto } from '../dtos/create-user.dto';
import type { QueryUsersDto } from '../dtos/query-users.dto';
import type { UpdateUserDto } from '../dtos/update-user.dto';

/**
 * Application logic for user accounts.
 *
 * The only way in or out of the users table. AuthService reads through the
 * cross-module methods at the bottom of this file rather than reaching for
 * UsersRepository — so the invariants enforced here (role/company pairing,
 * last-administrator protection, uniqueness) cannot be bypassed by another
 * feature, which is the whole point of the repository boundary rule.
 *
 * Nothing in this class touches an HTTP request or response.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly companiesService: CompaniesService,
    private readonly passwordService: PasswordService,
  ) {}

  /* --------------------------------------------------------------- reads */

  async findPaginated(query: QueryUsersDto): Promise<[User[], number]> {
    return this.usersRepository.findPaginated(query);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new ResourceNotFoundException('User', id);
    return user;
  }

  /* -------------------------------------------------------------- create */

  /**
   * Creates an account and returns it with its single-use password.
   *
   * The password is generated here, not supplied by the administrator: it is
   * never chosen by someone other than its owner, never reused across
   * accounts, and never recoverable after this call returns.
   */
  async create(dto: CreateUserDto): Promise<{ user: User; temporaryPassword: string }> {
    await this.assertIdentifiersAvailable(dto.username, dto.email);
    await this.assertRoleCompanyPairing(dto.role, dto.companyId);

    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    const passwordHash = await this.passwordService.hash(temporaryPassword);

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        username: dto.username,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        group: dto.group ?? null,
        companyId: dto.companyId ?? null,
        jobTitle: dto.jobTitle ?? null,
        phone: dto.phone ?? null,
        passwordHash,
        // Forces a change at first sign-in, so the credential the
        // administrator saw is dead the moment the user signs in.
        mustChangePassword: true,
        isActive: true,
      }),
    );

    this.logger.log(`User created: ${user.username} (${user.role})`);

    // Re-read so the response carries the company relation.
    return { user: await this.findById(user.id), temporaryPassword };
  }

  /* -------------------------------------------------------------- update */

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Optimistic locking. Checked here rather than left to TypeORM so the
    // failure is a clear 409 the client can act on, instead of a driver error.
    if (dto.version !== undefined && dto.version !== user.version) {
      throw new VersionConflictException('user');
    }

    if (dto.email && dto.email !== user.email) {
      if (await this.usersRepository.existsByEmail(dto.email)) {
        throw new ResourceConflictException('That email address is already in use.');
      }
      user.email = dto.email;
    }

    const nextRole = dto.role ?? user.role;
    const nextCompanyId = dto.companyId !== undefined ? dto.companyId : user.companyId;

    if (dto.role !== undefined || dto.companyId !== undefined) {
      // Checked before the role/company pairing on purpose. Both can fail at
      // once — demoting the last administrator to RM without naming a company
      // breaks two rules — and the last-administrator rule is the one the
      // caller needs to hear about, because fixing the other one still will
      // not let the change through.
      if (user.role === UserRole.ADMIN && nextRole !== UserRole.ADMIN) {
        await this.assertNotLastAdministrator(user.id);
      }

      await this.assertRoleCompanyPairing(nextRole, nextCompanyId ?? undefined);

      user.role = nextRole;
      user.companyId = nextCompanyId ?? null;
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.group !== undefined) user.group = dto.group;
    if (dto.jobTitle !== undefined) user.jobTitle = dto.jobTitle;
    if (dto.phone !== undefined) user.phone = dto.phone;

    await this.usersRepository.save(user);
    this.logger.log(`User updated: ${user.username}`);

    return this.findById(id);
  }

  /* --------------------------------------------------- activation / delete */

  /**
   * Deactivation, not deletion, is the normal end of an account's life: the
   * user still owns pipeline entries and appears in years of audit rows, and
   * those references have to keep resolving.
   *
   * AuthController revokes the user's refresh tokens after this returns, so a
   * deactivated account cannot ride an existing session — JwtStrategy also
   * re-checks `isActive` on every request, so access ends within one token
   * lifetime at worst and immediately in practice.
   */
  async setActive(id: string, isActive: boolean, actingUserId: string): Promise<User> {
    if (id === actingUserId && !isActive) {
      throw new AccessDeniedException('You cannot deactivate your own account.');
    }

    const user = await this.findById(id);
    if (user.isActive === isActive) return user;

    if (!isActive && user.role === UserRole.ADMIN) {
      await this.assertNotLastAdministrator(user.id);
    }

    user.isActive = isActive;
    await this.usersRepository.save(user);
    this.logger.log(`User ${isActive ? 'activated' : 'deactivated'}: ${user.username}`);

    return this.findById(id);
  }

  async softDelete(id: string, actingUserId: string): Promise<void> {
    if (id === actingUserId) {
      throw new AccessDeniedException('You cannot delete your own account.');
    }

    const user = await this.findById(id);
    if (user.role === UserRole.ADMIN) await this.assertNotLastAdministrator(user.id);

    await this.usersRepository.softDelete(id);
    this.logger.warn(`User soft-deleted: ${user.username}`);
  }

  /* ------------------------------------------- cross-module contract (auth) */

  /**
   * The methods below are the interface AuthModule depends on. They exist so
   * that AuthService never injects UsersRepository — everything it needs from
   * the users table is named and reviewable here.
   */

  findByUsernameForAuthentication(username: string): Promise<User | null> {
    return this.usersRepository.findByUsernameWithSecret(username);
  }

  findByIdForAuthentication(id: string): Promise<User | null> {
    return this.usersRepository.findByIdWithSecret(id);
  }

  recordFailedLogin(id: string, lockUntil: Date | null): Promise<void> {
    return this.usersRepository.recordFailedLogin(id, lockUntil);
  }

  recordSuccessfulLogin(id: string, at: Date): Promise<void> {
    return this.usersRepository.recordSuccessfulLogin(id, at);
  }

  updatePassword(id: string, passwordHash: string, changedAt: Date): Promise<void> {
    return this.usersRepository.updatePassword(id, passwordHash, changedAt);
  }

  /* ------------------------------------------------------------ invariants */

  private async assertIdentifiersAvailable(username: string, email: string): Promise<void> {
    const fields: Record<string, string[]> = {};

    if (await this.usersRepository.existsByUsername(username)) {
      fields.username = ['That username is already taken.'];
    }
    if (await this.usersRepository.existsByEmail(email)) {
      fields.email = ['That email address is already in use.'];
    }

    // Reported as field errors rather than a bare 409 so the form can mark the
    // offending input. This does disclose that an account exists — acceptable
    // here because the endpoint is Admin-only; it is exactly what must NOT
    // happen on the public sign-in route.
    if (Object.keys(fields).length > 0) throw new ValidationException(fields);
  }

  /**
   * Role and company must agree:
   *  · RM is scoped to one company, so `companyId` is required;
   *  · leadership roles are group-wide, so a company would be meaningless and
   *    would quietly narrow their visibility once scoping is added;
   *  · Employee may have one or not.
   *
   * The database CHECK constraint enforces the RM half independently. This is
   * the readable half, and it produces a usable error.
   */
  private async assertRoleCompanyPairing(role: UserRole, companyId?: string): Promise<void> {
    if (role === UserRole.RM && !companyId) {
      throw new ValidationException({
        companyId: ['A Relationship Manager must belong to a group company.'],
      });
    }

    if (companyId && LEADERSHIP_ROLES.includes(role)) {
      throw new ValidationException({
        companyId: [`The ${role} role is group-wide and must not be tied to a company.`],
      });
    }

    if (companyId && !(await this.companiesService.isActiveCompany(companyId))) {
      throw new ValidationException({
        companyId: ['That company does not exist or is no longer active.'],
      });
    }
  }

  private async assertNotLastAdministrator(id: string): Promise<void> {
    const administrators = await this.usersRepository.countByRole(UserRole.ADMIN);
    if (administrators <= 1) {
      throw new AccessDeniedException(
        'This is the only active administrator. Promote another account first.',
      );
    }
    this.logger.warn(`Administrator ${id} is being demoted or deactivated.`);
  }
}
