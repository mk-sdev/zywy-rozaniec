import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserrepositoryService } from '../userrepository/userrepository.service';

@Injectable()
export class MailService {
  constructor(
    private userRepository: UserrepositoryService,
    private readonly mailerService: MailerService,
  ) {}

  async changeEmail(currentEmail: string, newEmail: string, password: string) {
    const user = await this.userRepository.findOne(currentEmail);
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

    const emailExists = await this.userRepository.findOne(newEmail);
    if (emailExists) {
      throw new ConflictException('This email is already in use!');
    }

    const verificationToken = randomUUID();
    user.pendingEmail = newEmail;
    user.emailChangeToken = verificationToken;
    user.emailChangeTokenExpires = Date.now() + 1000 * 60 * 60; // 1h
    await user.save();

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

  async verifyToken(token: string): Promise<void> {
    const user = await this.userRepository.findOneByToken(token);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
  }

  async confirmEmailChange(token: string): Promise<void> {
    const user = await this.userRepository.findOneByEmailToken(token);

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.emailChangeTokenExpires! < Date.now()) {
      throw new BadRequestException('The token has expired');
    }
    if (!user.pendingEmail) {
      throw new BadRequestException('No new email address to verify');
    }

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailChangeToken = undefined;
    user.emailChangeTokenExpires = undefined;

    await user.save();
  }

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

  async remindPassword(email: string, message: string) {
    const user = await this.userRepository.findOne(email);

    if (!user) {
      // Do not do anything, in order to not to reveal the account exists in the database
      return {
        message,
      };
    }

    const resetToken = randomUUID();

    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpires = Date.now() + 1000 * 60 * 60; // 1h
    // todo: delete all refresh tokens
    await user.save();

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
