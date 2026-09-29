import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  AccountInactiveException,
  AccountLockedException,
  InvalidCredentialsException,
} from 'src/common/exceptions/app.exception';
import { PasswordService } from 'src/modules/password/services/password.service';
import { UsersService } from 'src/modules/users/services/users.service';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import type { User } from 'src/modules/users/entities/user.entity';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { LoginAttemptRepository } from '../repositories/login-attempt.repository';

/**
 * AuthService unit tests.
 *
 * The emphasis is on the security properties rather than the happy path,
 * because those are the ones that break silently: a refactor that returns a
 * different exception for an unknown username still passes a "login works"
 * test while reintroducing account enumeration.
 */
describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let loginAttemptRepository: jest.Mocked<LoginAttemptRepository>;

  const context = { ip: '198.51.100.7', userAgent: 'jest' };

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 'user-1',
      username: 'y.fahmy',
      email: 'y.fahmy@contact.eg',
      name: 'Youssef Fahmy',
      role: UserRole.RM,
      companyId: 'company-1',
      passwordHash: '$argon2id$stored-digest',
      passwordChangedAt: null,
      mustChangePassword: false,
      isActive: true,
      failedLoginCount: 0,
      lockedUntil: null,
      get isLocked() {
        return this.lockedUntil !== null && this.lockedUntil.getTime() > Date.now();
      },
      ...overrides,
    }) as User;

  const tokens = {
    accessToken: 'access.jwt',
    refreshToken: 'refresh.jwt',
    expiresIn: 900,
    refreshMaxAgeMs: 604_800_000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByUsernameForAuthentication: jest.fn(),
            findByIdForAuthentication: jest.fn(),
            recordFailedLogin: jest.fn().mockResolvedValue(undefined),
            recordSuccessfulLogin: jest.fn().mockResolvedValue(undefined),
            updatePassword: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            verify: jest.fn(),
            verifyDummy: jest.fn().mockResolvedValue(undefined),
            hash: jest.fn().mockResolvedValue('$argon2id$new-digest'),
            needsRehash: jest.fn().mockReturnValue(false),
          },
        },
        {
          provide: TokenService,
          useValue: {
            issuePair: jest.fn().mockResolvedValue(tokens),
            rotate: jest.fn().mockResolvedValue(tokens),
            revoke: jest.fn().mockResolvedValue(undefined),
            revokeAllForUser: jest.fn().mockResolvedValue(2),
          },
        },
        {
          provide: LoginAttemptRepository,
          useValue: {
            record: jest.fn().mockResolvedValue(undefined),
            countRecentFailures: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue({ maxAttempts: 5, attemptWindowMinutes: 15, lockoutMinutes: 15 }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    loginAttemptRepository = module.get(LoginAttemptRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('issues a token pair for valid credentials', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValue(true);

      const result = await service.login({ username: 'y.fahmy', password: 'correct' }, context);

      expect(result.tokens).toEqual(tokens);
      expect(tokenService.issuePair).toHaveBeenCalledTimes(1);
      expect(usersService.recordSuccessfulLogin).toHaveBeenCalledWith('user-1', expect.any(Date));
    });

    // Section 4: authentication failures must not reveal whether an account exists.
    it('returns the same error for an unknown username as for a wrong password', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(null);
      const unknownUser = await service
        .login({ username: 'nobody', password: 'x' }, context)
        .catch((error: unknown) => error);

      usersService.findByUsernameForAuthentication.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValue(false);
      const wrongPassword = await service
        .login({ username: 'y.fahmy', password: 'wrong' }, context)
        .catch((error: unknown) => error);

      expect(unknownUser).toBeInstanceOf(InvalidCredentialsException);
      expect(wrongPassword).toBeInstanceOf(InvalidCredentialsException);
      expect((unknownUser as InvalidCredentialsException).getResponse()).toEqual(
        (wrongPassword as InvalidCredentialsException).getResponse(),
      );
    });

    // Without the dummy hash, the unknown-user branch returns in microseconds
    // and the known-user branch in ~300ms — a usable enumeration oracle.
    it('spends hashing time even when the username does not exist', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(null);

      await expect(service.login({ username: 'nobody', password: 'x' }, context)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(passwordService.verifyDummy).toHaveBeenCalledWith('x');
    });

    it('records a failed attempt when the username is unknown', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(null);

      await expect(service.login({ username: 'nobody', password: 'x' }, context)).rejects.toThrow();
      expect(loginAttemptRepository.record).toHaveBeenCalledWith(
        expect.objectContaining({ successful: false, failureReason: 'unknown-user', userId: null }),
      );
    });

    it('refuses a locked account before verifying the password', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60_000);
      usersService.findByUsernameForAuthentication.mockResolvedValue(buildUser({ lockedUntil }));

      await expect(
        service.login({ username: 'y.fahmy', password: 'correct' }, context),
      ).rejects.toThrow(AccountLockedException);
      expect(passwordService.verify).not.toHaveBeenCalled();
    });

    it('locks the account once the attempt threshold is reached', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValue(false);
      // Four prior failures; this one makes five.
      loginAttemptRepository.countRecentFailures.mockResolvedValue(4);

      await expect(
        service.login({ username: 'y.fahmy', password: 'wrong' }, context),
      ).rejects.toThrow(InvalidCredentialsException);

      expect(usersService.recordFailedLogin).toHaveBeenCalledWith('user-1', expect.any(Date));
    });

    it('does not lock the account below the threshold', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValue(false);
      loginAttemptRepository.countRecentFailures.mockResolvedValue(1);

      await expect(
        service.login({ username: 'y.fahmy', password: 'wrong' }, context),
      ).rejects.toThrow(InvalidCredentialsException);

      expect(usersService.recordFailedLogin).toHaveBeenCalledWith('user-1', null);
    });

    // Checked after the password so a deactivated account is not distinguishable
    // to someone who does not hold the correct credential.
    it('rejects a deactivated account only after the password verifies', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(
        buildUser({ isActive: false }),
      );
      passwordService.verify.mockResolvedValue(true);

      await expect(
        service.login({ username: 'y.fahmy', password: 'correct' }, context),
      ).rejects.toThrow(AccountInactiveException);
      expect(passwordService.verify).toHaveBeenCalled();
    });

    it('transparently upgrades a hash written with weaker parameters', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValue(true);
      passwordService.needsRehash.mockReturnValue(true);

      await service.login({ username: 'y.fahmy', password: 'correct' }, context);

      expect(passwordService.hash).toHaveBeenCalledWith('correct');
      expect(usersService.updatePassword).toHaveBeenCalled();
    });

    it('still signs the user in when the audit write fails', async () => {
      usersService.findByUsernameForAuthentication.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValue(true);
      loginAttemptRepository.record.mockRejectedValue(new Error('audit table unavailable'));

      await expect(
        service.login({ username: 'y.fahmy', password: 'correct' }, context),
      ).resolves.toMatchObject({ tokens });
    });
  });

  describe('refresh', () => {
    it('rotates the token for an active user', async () => {
      usersService.findByIdForAuthentication.mockResolvedValue(buildUser());

      const result = await service.refresh('refresh.jwt', 'user-1', context);

      expect(result.tokens).toEqual(tokens);
      expect(tokenService.rotate).toHaveBeenCalledWith('refresh.jwt', expect.anything(), context);
    });

    // A 7-day refresh token must not outlive the account it belongs to.
    it('revokes the token and refuses when the account was deactivated', async () => {
      usersService.findByIdForAuthentication.mockResolvedValue(buildUser({ isActive: false }));

      await expect(service.refresh('refresh.jwt', 'user-1', context)).rejects.toThrow(
        AccountInactiveException,
      );
      expect(tokenService.revoke).toHaveBeenCalledWith('refresh.jwt', 'admin');
      expect(tokenService.rotate).not.toHaveBeenCalled();
    });

    it('refuses when the user no longer exists', async () => {
      usersService.findByIdForAuthentication.mockResolvedValue(null);

      await expect(service.refresh('refresh.jwt', 'gone', context)).rejects.toThrow(
        AccountInactiveException,
      );
    });
  });

  describe('changePassword', () => {
    it('updates the hash and revokes every session', async () => {
      usersService.findByIdForAuthentication.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      await service.changePassword('user-1', {
        currentPassword: 'old',
        newPassword: 'NewPassword1!',
      });

      expect(usersService.updatePassword).toHaveBeenCalledWith(
        'user-1',
        '$argon2id$new-digest',
        expect.any(Date),
      );
      expect(tokenService.revokeAllForUser).toHaveBeenCalledWith('user-1', 'password-changed');
    });

    it('rejects a wrong current password', async () => {
      usersService.findByIdForAuthentication.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrong',
          newPassword: 'NewPassword1!',
        }),
      ).rejects.toThrow(InvalidCredentialsException);
      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects reusing the current password', async () => {
      usersService.findByIdForAuthentication.mockResolvedValue(buildUser());
      // Current password verifies, and the "new" one matches the same digest.
      passwordService.verify.mockResolvedValue(true);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'same',
          newPassword: 'SamePassword1!',
        }),
      ).rejects.toThrow(InvalidCredentialsException);
      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });
  });
});
