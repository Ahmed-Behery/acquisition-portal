import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, type DeepPartial } from 'typeorm';
import { User } from '../entities/user.entity';
import type { QueryUsersDto, UserSortField } from '../dtos/query-users.dto';

/**
 * Persistence for User. Owned by UsersModule.
 *
 * Contains no business rules — no lockout policy, no role invariants, no
 * password handling. Those live in UsersService and AuthService. What is here
 * is query construction, and the one thing it is strict about is that
 * `sortBy` never reaches SQL unmapped.
 */

/**
 * Sort key → column. The allowlist that makes ORDER BY safe: an identifier
 * cannot be a bound parameter, so the only defence is never interpolating
 * caller input. An unknown key falls back to `created_at` rather than throwing,
 * because the DTO has already rejected anything outside the union.
 */
const SORT_COLUMNS: Record<UserSortField, string> = {
  name: 'user.name',
  username: 'user.username',
  email: 'user.email',
  role: 'user.role',
  createdAt: 'user.created_at',
  lastLoginAt: 'user.last_login_at',
};

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /* ------------------------------------------------------------- reading */

  /**
   * Paginated list with filters.
   *
   * `leftJoinAndSelect` on company is deliberate: the response DTO exposes
   * `companyCode`, and fetching it lazily per row is the N+1 this avoids.
   */
  async findPaginated(query: QueryUsersDto): Promise<[User[], number]> {
    const qb = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company');

    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.group) qb.andWhere('user.group = :group', { group: query.group });
    if (query.companyId)
      qb.andWhere('user.company_id = :companyId', { companyId: query.companyId });
    if (query.isActive !== undefined) {
      qb.andWhere('user.is_active = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      // Parameterised, so the wildcards are data rather than syntax. Escapes
      // the LIKE metacharacters a user might legitimately type in a name.
      const term = `%${query.search.replace(/[%_\\]/g, '\\$&')}%`;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('user.name ILIKE :term', { term })
            .orWhere('user.username ILIKE :term', { term })
            .orWhere('user.email ILIKE :term', { term });
        }),
      );
    }

    qb.orderBy(SORT_COLUMNS[query.sortBy] ?? SORT_COLUMNS.createdAt, query.sortOrder)
      // Tie-break on a unique column so pagination is stable: without it, rows
      // with equal sort keys can repeat or vanish between pages.
      .addOrderBy('user.id', 'ASC')
      .skip(query.skip)
      .take(query.limit);

    return qb.getManyAndCount();
  }

  findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id }, relations: { company: true } });
  }

  /**
   * Includes the password hash. Named so that every call site reads as a
   * deliberate choice — grep for `WithSecret` to audit who can see a hash.
   * Only AuthService should appear in that list.
   */
  findByUsernameWithSecret(username: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.company', 'company')
      .where('user.username = :username', { username })
      .getOne();
  }

  findByIdWithSecret(id: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  existsByUsername(username: string): Promise<boolean> {
    return this.repository.exists({ where: { username } });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.repository.exists({ where: { email } });
  }

  countByRole(role: User['role']): Promise<number> {
    return this.repository.count({ where: { role, isActive: true } });
  }

  /* ------------------------------------------------------------- writing */

  create(data: DeepPartial<User>): User {
    return this.repository.create(data);
  }

  save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  softDelete(id: string): Promise<unknown> {
    return this.repository.softDelete(id);
  }

  /* ----------------------------------------------- authentication counters */

  /**
   * These bypass the entity and its `@VersionColumn` on purpose.
   *
   * A failed sign-in must not fail because of an optimistic-lock clash, and
   * incrementing a counter is not an edit anyone needs to detect as
   * concurrent. `failed_login_count + 1` in SQL is also atomic, where a
   * read-modify-write would lose increments under parallel attempts — which is
   * exactly the condition a brute-force attack creates.
   */
  async recordFailedLogin(id: string, lockUntil: Date | null): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(User)
      .set({
        failedLoginCount: () => '"failed_login_count" + 1',
        ...(lockUntil ? { lockedUntil: lockUntil } : {}),
      })
      .where('id = :id', { id })
      .execute();
  }

  async recordSuccessfulLogin(id: string, at: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(User)
      .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: at })
      .where('id = :id', { id })
      .execute();
  }

  async updatePassword(id: string, passwordHash: string, changedAt: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(User)
      .set({
        passwordHash,
        passwordChangedAt: changedAt,
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
      })
      .where('id = :id', { id })
      .execute();
  }
}
