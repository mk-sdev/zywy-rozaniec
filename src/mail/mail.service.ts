import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import {
  account_verification_lifespan,
  email_change_lifespan,
  password_reset_lifespan,
} from 'src/utils/constants';
import { RepositoryService } from '../repository/repository.service';

@Injectable()
export class MailService {
  constructor(
    private repositoryService: RepositoryService,
    private readonly mailerService: MailerService,
  ) {}

  async sendMailWithToken(
    toEmail: string,
    token: string,
    subject: string,
    template?: string,
    contextData?: Record<string, any>,
    baseUrl: string = 'http://localhost:3000',
    tokenQueryParamName: string = 'token',
    path?: string,
  ) {
    const tokenPath = path ? `${path}` : '';
    const confirmationLink = `${baseUrl}${tokenPath}?${tokenQueryParamName}=${token}`;

    const context = contextData
      ? { ...contextData, confirmationLink }
      : { confirmationLink };

    await this.mailerService.sendMail({
      to: toEmail,
      subject,
      template,
      context,
      html: !template
        ? `
          <h3>Welcome!</h3>
          <p>Click the link below:</p>
          <a href="${confirmationLink}">${confirmationLink}</a>
          <p>If that's not you, ignore this message.</p>
        `
        : undefined,
    });
  }

  async register(email: string, password: string): Promise<void> {
    const existingUser = await this.repositoryService.findOneByEmail(email);
    if (existingUser) {
      // do not do anything to not to reveal the account exists in the db
      // throw new ConflictException('Email already in use');
    }

    // @ts-ignore
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Dodaj użytkownika do bazy
    await this.repositoryService.insertOne({
      email,
      password: hashedPassword,
    });

    const newUser = await this.repositoryService.findOneByEmail(email);
    if (!newUser) {
      throw new InternalServerErrorException('User creation failed');
    }

    const verificationToken = randomUUID();
    const tokenExpiresAt = Date.now() + account_verification_lifespan;

    // Przenieś zapis tokenu do repo
    await this.repositoryService.setVerificationToken(
      newUser._id as string,
      verificationToken,
      tokenExpiresAt,
    );

    await this.sendMailWithToken(
      email,
      verificationToken,
      'Aktywuj swoje konto',
      undefined, // no template
      undefined,
      'http://localhost:3000',
      'token',
      '/verify-account',
    );
  }

  // verifies a registration token
  async verifyToken(token: string): Promise<void> {
    const user = await this.repositoryService.findOneByToken(token);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.verificationTokenExpires! < Date.now()) {
      throw new BadRequestException('The token has expired');
    }

    await this.repositoryService.verifyAccount(String(user._id));
  }

  async changeEmail(id: string, newEmail: string, password: string) {
    const user = await this.repositoryService.findOne(id);
    if (!user) {
      throw new NotFoundException(
        'User with the given email address doesn`t exist',
      );
    }

    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password');
    }

    const emailExists = await this.repositoryService.findOneByEmail(newEmail);
    if (emailExists) {
      throw new ConflictException('This email is already in use!');
    }

    const verificationToken = randomUUID();
    const emailChangeTokenExpires = Date.now() + email_change_lifespan;

    await this.repositoryService.markEmailChangePending(
      id,
      newEmail,
      verificationToken,
      emailChangeTokenExpires,
    );

    await this.sendMailWithToken(
      newEmail,
      verificationToken,
      'Confirm email address change',
      'email-change-confirmation',
      {},
      'http://localhost:3000',
      'token',
      '/verify-email',
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.repositoryService.findOneByEmailToken(token);

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.emailChangeTokenExpires! < Date.now()) {
      throw new BadRequestException('The token has expired');
    }
    if (!user.pendingEmail) {
      throw new BadRequestException('No new email address to verify');
    }

    await this.repositoryService.confirmEmailChange(
      String(user._id),
      user.pendingEmail,
    );
  }

  async remindPassword(email: string, message: string) {
    const user = await this.repositoryService.findOneByEmail(email);

    if (!user) {
      // Do not do anything, in order to not to reveal the account exists in the database
      return {
        message,
      };
    }

    const resetToken = randomUUID();
    const passwordResetTokenExpires = Date.now() + password_reset_lifespan;

    await this.repositoryService.remindPassword(
      email,
      resetToken,
      passwordResetTokenExpires,
    );

    await this.sendMailWithToken(
      email,
      resetToken,
      'Reset hasła',
      'password-reset',
      {},
      'http://localhost:3000',
      'token',
      '/reset-password',
    );
  }

  
}
