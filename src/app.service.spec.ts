import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { RepositoryService } from './repository/repository.service';
import { JwtPayload } from './utils/interfaces';
import { HashService } from './hash.service';

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

  const hashService = {
    verify: jest.fn(),
    hash: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: RepositoryService,
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
          provide: HashService,
          useValue: hashService,
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
      const mockPayload: JwtPayload = {
        sub: 'userId',
        iat: 1234567890,
        exp: 1234567890,
      };
      const plainToken = 'some-refresh-token';
      const hashedToken = { token: 'hashed-version-of-token' };

      // mock verifyAsync, so that it returns payload with userId
      mockJwtRefreshService.verifyAsync = jest
        .fn()
        .mockResolvedValue(mockPayload);

      // mock findOne, so that it returns a user with the hashed token
      mockUserRepo.findOne = jest.fn().mockResolvedValue({
        refreshTokens: [hashedToken],
      });

      // mock hashService.verify, so that it returns true (token is valid)
      jest.spyOn(hashService, 'verify').mockResolvedValue(true);

      // mock removeRefreshToken
      mockUserRepo.removeRefreshToken = jest.fn().mockResolvedValue(undefined);

      // call the function
      await appService.logout(plainToken);

      // Sprawdź wywołania
      expect(mockJwtRefreshService.verifyAsync).toHaveBeenCalledWith(
        plainToken,
      );
      expect(mockUserRepo.findOne).toHaveBeenCalledWith('userId');
      expect(hashService.verify).toHaveBeenCalledWith(
        hashedToken.token,
        plainToken,
      );
      expect(mockUserRepo.removeRefreshToken).toHaveBeenCalledWith(
        'userId',
        hashedToken.token,
      );
    });

    it('should not throw if refresh token is invalid', async () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // the token cannot be decoded
      mockJwtRefreshService.verifyAsync = jest
        .fn()
        .mockRejectedValue(new Error('Invalid token'));

      await expect(appService.logout('invalid-token')).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Logout error:',
        'Invalid token',
      );

      consoleWarnSpy.mockRestore(); // return the default behavior of console.warn
    });
  });
});
