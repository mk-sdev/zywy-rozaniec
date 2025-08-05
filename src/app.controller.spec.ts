import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtGuard } from './jwt.guard';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

describe('AppController (integration)', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AppController>(AppController);
  });

  describe('ValidationPipe for RegisterDto', () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const invalidDtos = [
      // INVALID loginS
      { login: '', password: 'Valid1@Pass' }, // empty login
      { login: '   ', password: 'Valid1@Pass' }, // login only spaces
      { login: null, password: 'Valid1@Pass' }, // null login
      { login: undefined, password: 'Valid1@Pass' }, // undefined login
      { login: 12345678, password: 'Valid1@Pass' }, // invalid login type (number)
      { login: {}, password: 'Valid1@Pass' }, // invalid login type (object)
      { login: 'a'.repeat(320), password: 'Valid1@Pass' }, // excessively long login
      { login: 'a', password: 'Valid1@Pass' }, // too short login

      // INVALID PASSWORDS
      { login: 'login123', password: '' }, // empty password
      { login: 'login123', password: '        ' }, // only spaces
      { login: 'login123', password: null }, // null password
      { login: 'login123', password: undefined }, // undefined password
      { login: 'login123', password: {} }, // wrong type (object)
      { login: 'login123', password: 12345678 }, // wrong type (number)
      { login: 'login123', password: 'short' }, // too short
      { login: 'login123', password: '!aA1' }, // valid structure, but too short
      {
        login: 'login123',
        password:
          'this_password_id_too_long_because_it_contains_more_than_30_chars',
      }, // too long
      { login: 'login123', password: 'zaq12WSX' }, // no special chars
      { login: 'login123', password: 'zaq1@wsx' }, // no uppercase
      { login: 'login123', password: 'ZAQ1@WSX' }, // no lowercase
      { login: 'login123', password: 'zaq!@WSX' }, // no digit

      { login: 'login123', password: 'zaq1!@WSX', additional: 1 }, // extra attribute
    ];

    invalidDtos.forEach((dto, index) => {
      it(`should throw validation error for invalid DTO #${index + 1}`, async () => {
        await expect(
          validationPipe.transform(dto, {
            type: 'body',
            metatype: RegisterDto,
          }),
        ).rejects.toThrow();
      });
    });

    it('should pass validation for valid DTO', async () => {
      const validDto = {
        login: 'example@gmail.com',
        password: 'P@ssword456',
      };
      await expect(
        validationPipe.transform(validDto, {
          type: 'body',
          metatype: RegisterDto,
        }),
      ).resolves.toEqual(validDto);
    });
  });

  describe('ValidationPipe for LoginDto', () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const invalidDtos = [
      // 🔴 Invalid login formats
      { login: '', password: 'Valid1@Pass' }, // empty login
      { login: null, password: 'Valid1@Pass' }, // null login
      { login: 12345, password: 'Valid1@Pass' }, // wrong type (number)
      { password: 'Valid1@Pass' }, // missing login

      // 🔴 Invalid passwords
      { login: 'login123', password: '' }, // empty password
      { login: 'login123', password: null }, // null password
      { login: 'login123', password: {} }, // invalid type (object)
      { login: 'login123', password: '       ' }, // only spaces
      { login: 'login123' }, // missing password

      { login: 'login123', password: 'Valid1@Pass', additional: 1 }, // extra attribute
    ];

    invalidDtos.forEach((dto, index) => {
      it(`should throw validation error for invalid DTO #${index + 1}`, async () => {
        await expect(
          validationPipe.transform(dto, {
            type: 'body',
            metatype: LoginDto,
          }),
        ).rejects.toThrow();
      });
    });

    it('should pass validation for valid DTO', async () => {
      const validDto = {
        login: 'login123',
        password: 'Password456',
      };
      await expect(
        validationPipe.transform(validDto, {
          type: 'body',
          metatype: LoginDto,
        }),
      ).resolves.toEqual(validDto);
    });
  });
});
