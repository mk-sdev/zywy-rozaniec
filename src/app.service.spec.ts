import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { UserrepositoryService } from './userrepository/userrepository.service';
import { MailService } from './mail/mail.service';
import * as bcrypt from 'bcrypt';

describe('AppService', () => {
  let appService: AppService;

  const mockUserRepo = {
    findOne: jest.fn(),
    removeRefreshToken: jest.fn(),
    updatePasswordAndClearTokens: jest.fn(),
    markUserForDeletion: jest.fn(),
  };

  const mockJwtAccessService = {};

  const mockJwtRefreshService = {
    clearRefreshTokens: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockMailService = {
    sendPasswordChangedEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: UserrepositoryService,
          useValue: mockUserRepo,
        },
        {
          provide: 'JWT_ACCESS_SERVICE',
          useValue: mockJwtAccessService,
        },
        {
          provide: 'JWT_REFRESH_SERVICE',
          useValue: mockJwtRefreshService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    appService = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logout', () => {
    it('should remove refresh token on logout', async () => {
      const mockPayload = { sub: 'userId' };

      // Mock verifyAsync
      mockJwtRefreshService.verifyAsync = jest
        .fn()
        .mockResolvedValue(mockPayload);

      // Mock removeRefreshToken
      mockUserRepo.removeRefreshToken = jest.fn().mockResolvedValue(undefined);

      await appService.logout('some-refresh-token');

      expect(mockJwtRefreshService.verifyAsync).toHaveBeenCalledWith(
        'some-refresh-token',
      );
      expect(mockUserRepo.removeRefreshToken).toHaveBeenCalledWith(
        'userId',
        'some-refresh-token',
      );
    });

    it('should not throw if refresh token is invalid', async () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Token nie da się zdekodować
      mockJwtRefreshService.verifyAsync = jest
        .fn()
        .mockRejectedValue(new Error('Invalid token'));

      await expect(appService.logout('invalid-token')).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Logout error:',
        'Invalid token',
      );

      consoleWarnSpy.mockRestore(); // Przywrócenie domyślnego zachowania console.warn
    });
  });

  describe('changePassword', () => {
    it('should throw if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        appService.changePassword('userId', 'abc', 'def'),
      ).rejects.toThrow('The user of the given email doesn`t exist');
    });

    it('should throw if new password is same as current', async () => {
      await expect(
        appService.changePassword('userId', 'samepassword', 'samepassword'),
      ).rejects.toThrow('New password cannot be the same as the old one');
    });

    it('should throw if current password is invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'userId',
        password: 'hashedPassword',
        refreshtokens: [],
        save: jest.fn(),
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        appService.changePassword('userId', 'wrongpassword', 'newpassword'),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should change password and clear refresh tokens', async () => {
      const userMock = {
        _id: 'userId',
        email: 'test@example.com',
        password: 'hashedPassword',
        refreshtokens: ['token1', 'token2'],
      };

      mockUserRepo.findOne.mockResolvedValue(userMock);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword');
      mockUserRepo.updatePasswordAndClearTokens = jest
        .fn()
        .mockResolvedValue(undefined);

      await appService.changePassword('userId', 'oldPassword', 'newPassword');

      expect(mockUserRepo.updatePasswordAndClearTokens).toHaveBeenCalledWith(
        userMock.email,
        'newHashedPassword',
      );
    });
  });

  describe('markForDeletion', () => {
    it('should throw if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        appService.markForDeletion('userId', 'password'),
      ).rejects.toThrow('The user of the given email doesn`t exist');
    });

    it('should throw if password is incorrect', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'userId',
        password: 'hashedPassword',
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        appService.markForDeletion('userId', 'wrongpassword'),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should mark user for deletion and save', async () => {
      const userMock = {
        _id: 'userId',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      mockUserRepo.findOne.mockResolvedValue(userMock);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockUserRepo.markUserForDeletion = jest.fn().mockResolvedValue(undefined);

      const before = Date.now();

      await appService.markForDeletion('userId', 'correctPassword');

      expect(mockUserRepo.markUserForDeletion).toHaveBeenCalled();
      const callArgs = mockUserRepo.markUserForDeletion.mock.calls[0];
      expect(callArgs[0]).toEqual(userMock.email);

      // deletionScheduledAt jest timestampem - sprawdź, czy jest w oczekiwanym zakresie
      expect(callArgs[1]).toBeGreaterThan(before + 1000 * 60 * 60 * 24 * 13);
      expect(callArgs[1]).toBeLessThan(before + 1000 * 60 * 60 * 24 * 15);
    });
  });
});
