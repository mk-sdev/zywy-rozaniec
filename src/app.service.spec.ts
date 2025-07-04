import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { UserrepositoryService } from './userrepository/userrepository.service';
import { MailService } from './mail/mail.service';
import * as bcrypt from 'bcrypt';

describe('AppService', () => {
  let appService: AppService;

  const mockUserRepo = {
    findOne: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtAccessService = {};

  const mockJwtRefreshService = {
    clearRefreshTokens: jest.fn(),
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
    const saveMock = jest.fn();

    const userMock = {
      id: 'userId',
      password: 'hashedPassword',
      refreshtokens: ['token1', 'token2'],
      save: saveMock,
    };

    mockUserRepo.findOne.mockResolvedValue(userMock);

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword');

    await appService.changePassword('userId', 'oldPassword', 'newPassword');

    expect(userMock.refreshtokens).toEqual([]);

    expect(userMock.password).toEqual('newHashedPassword');

    expect(saveMock).toHaveBeenCalled();
  });
});
