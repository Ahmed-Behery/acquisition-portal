import { Test, type TestingModule } from '@nestjs/testing';
import {
  AccessDeniedException,
  ResourceNotFoundException,
  ValidationException,
  VersionConflictException,
} from 'src/common/exceptions/app.exception';
import { CompaniesService } from 'src/modules/companies/services/companies.service';
import { PasswordService } from 'src/modules/password/services/password.service';
import type { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from './users.service';

/**
 * UsersService unit tests.
 *
 * Focused on the invariants that cannot be expressed in a DTO: the role /
 * company pairing, the last-administrator guard, and optimistic locking.
 */
describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let companiesService: jest.Mocked<CompaniesService>;

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 'user-1',
      username: 'y.fahmy',
      email: 'y.fahmy@contact.eg',
      name: 'Youssef Fahmy',
      role: UserRole.RM,
      group: null,
      companyId: 'company-1',
      jobTitle: null,
      phone: null,
      isActive: true,
      mustChangePassword: false,
      version: 1,
      ...overrides,
    }) as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findPaginated: jest.fn(),
            findById: jest.fn(),
            existsByUsername: jest.fn().mockResolvedValue(false),
            existsByEmail: jest.fn().mockResolvedValue(false),
            countByRole: jest.fn().mockResolvedValue(3),
            create: jest.fn((data: Partial<User>) => data as User),
            save: jest.fn((user: User) => Promise.resolve(user)),
            softDelete: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CompaniesService,
          useValue: { isActiveCompany: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: PasswordService,
          useValue: {
            generateTemporaryPassword: jest.fn().mockReturnValue('Temp0raryPass!x'),
            hash: jest.fn().mockResolvedValue('$argon2id$digest'),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    usersRepository = module.get(UsersRepository);
    companiesService = module.get(CompaniesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      username: 'n.aziz',
      email: 'n.aziz@contact.eg',
      name: 'Nour Abdel Aziz',
      role: UserRole.RM,
      companyId: 'company-1',
    };

    it('creates the account with a generated single-use password', async () => {
      usersRepository.findById.mockResolvedValue(buildUser({ id: 'new-user' }));

      const result = await service.create(dto);

      expect(result.temporaryPassword).toBe('Temp0raryPass!x');
      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ mustChangePassword: true, passwordHash: '$argon2id$digest' }),
      );
    });

    it('rejects a duplicate username as a field error', async () => {
      usersRepository.existsByUsername.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ValidationException);
    });

    // Backed independently by a CHECK constraint; this is the readable half.
    it('requires a company for the RM role', async () => {
      await expect(service.create({ ...dto, companyId: undefined })).rejects.toThrow(
        ValidationException,
      );
    });

    // A leadership role tied to a company would quietly narrow its visibility
    // once record scoping is added.
    it('rejects a company on a group-wide role', async () => {
      await expect(
        service.create({ ...dto, role: UserRole.CEO, companyId: 'company-1' }),
      ).rejects.toThrow(ValidationException);
    });

    it('rejects an unknown or inactive company', async () => {
      companiesService.isActiveCompany.mockResolvedValue(false);

      await expect(service.create(dto)).rejects.toThrow(ValidationException);
    });
  });

  describe('update', () => {
    it('rejects a stale version rather than overwriting', async () => {
      usersRepository.findById.mockResolvedValue(buildUser({ version: 4 }));

      await expect(service.update('user-1', { name: 'New Name', version: 2 })).rejects.toThrow(
        VersionConflictException,
      );
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('applies the change when the version matches', async () => {
      usersRepository.findById.mockResolvedValue(buildUser({ version: 4 }));

      await service.update('user-1', { name: 'New Name', version: 4 });

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
    });

    it('applies the change when no version is supplied', async () => {
      usersRepository.findById.mockResolvedValue(buildUser({ version: 4 }));

      await service.update('user-1', { name: 'New Name' });

      expect(usersRepository.save).toHaveBeenCalled();
    });

    // There is no other way to create an administrator, so this would be
    // unrecoverable without a database console.
    it('refuses to demote the last administrator', async () => {
      usersRepository.findById.mockResolvedValue(
        buildUser({ role: UserRole.ADMIN, companyId: null }),
      );
      usersRepository.countByRole.mockResolvedValue(1);

      await expect(service.update('user-1', { role: UserRole.RM })).rejects.toThrow(
        AccessDeniedException,
      );
    });

    it('allows demoting an administrator when another remains', async () => {
      usersRepository.findById.mockResolvedValue(
        buildUser({ role: UserRole.ADMIN, companyId: null }),
      );
      usersRepository.countByRole.mockResolvedValue(2);

      await expect(
        service.update('user-1', { role: UserRole.RM, companyId: 'company-1' }),
      ).resolves.toBeDefined();
    });

    it('throws when the user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'x' })).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('setActive', () => {
    it('refuses self-deactivation', async () => {
      await expect(service.setActive('user-1', false, 'user-1')).rejects.toThrow(
        AccessDeniedException,
      );
    });

    it('refuses to deactivate the last administrator', async () => {
      usersRepository.findById.mockResolvedValue(
        buildUser({ role: UserRole.ADMIN, companyId: null }),
      );
      usersRepository.countByRole.mockResolvedValue(1);

      await expect(service.setActive('user-1', false, 'admin-2')).rejects.toThrow(
        AccessDeniedException,
      );
    });

    it('is a no-op when the state already matches', async () => {
      usersRepository.findById.mockResolvedValue(buildUser({ isActive: true }));

      await service.setActive('user-1', true, 'admin-2');

      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('refuses self-deletion', async () => {
      await expect(service.softDelete('user-1', 'user-1')).rejects.toThrow(AccessDeniedException);
    });

    it('soft-deletes another account', async () => {
      usersRepository.findById.mockResolvedValue(buildUser());

      await service.softDelete('user-1', 'admin-2');

      expect(usersRepository.softDelete).toHaveBeenCalledWith('user-1');
    });
  });
});
