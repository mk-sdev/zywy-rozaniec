import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from 'src/userrepository/user.schema';
import * as bcrypt from 'bcrypt';
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
      throw new NotFoundException('Użytkownik nie istnieje');
    }

    // Sprawdzenie hasła
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowe hasło');
    }

    // Sprawdzenie czy nowy email już istnieje
    const emailExists = await this.userRepository.findOne(newEmail);
    if (emailExists) {
      throw new ConflictException('Nowy email jest już używany');
    }

    const verificationToken = randomUUID();
    user.pendingEmail = newEmail;
    user.emailChangeToken = verificationToken;
    user.emailChangeTokenExpires = Date.now() + 1000 * 60 * 60; // 1h ważności
    await user.save();

    await this.sendMailWithToken(
      newEmail,
      verificationToken,
      'Potwierdź zmianę adresu email',
      'email-change-confirmation',
      {}, // lub inne dane do templatu
      'http://localhost:3000',
      'token',
      '/confirm-email-change',
    );
  }

  async verifyToken(token: string): Promise<User> {
    const user = await this.userRepository.findOneByToken(token);
    if (!user) {
      throw new BadRequestException('Nieprawidłowy token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return user;
  }

  async confirmEmailChange(token: string): Promise<void> {
    const user = await this.userRepository.findOneByEmailToken(token);

    if (!user) {
      throw new BadRequestException('Nieprawidłowy token');
    }

    if (user.emailChangeTokenExpires! < Date.now()) {
      throw new BadRequestException('Token wygasł');
    }
    if (!user.pendingEmail) {
      throw new BadRequestException(
        'Brak nowego adresu email do potwierdzenia',
      );
    }

    // Potwierdzamy nowy email
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
    baseUrl: string = 'http://localhost:3000', // domyślny adres frontend/backend
    tokenQueryParamName: string = 'token', // domyślna nazwa parametru z tokenem w linku
    path?: string, // ścieżka w linku, np. '/verify-account' lub '/confirm-email-change'
  ) {
    // Skonstruuj URL do kliknięcia
    const tokenPath = path ? `${path}` : '';
    const confirmationLink = `${baseUrl}${tokenPath}?${tokenQueryParamName}=${token}`;

    // Przygotuj kontekst dla templatu (jeśli jest)
    const context = contextData
      ? { ...contextData, confirmationLink }
      : { confirmationLink };

    await this.mailerService.sendMail({
      to: toEmail,
      subject,
      template,
      context,
      // Jeśli nie masz template engine, możesz też wysłać zwykły html:
      html: !template
        ? `
          <h3>Witaj!</h3>
          <p>Kliknij poniższy link:</p>
          <a href="${confirmationLink}">${confirmationLink}</a>
          <p>Jeśli to nie Ty, zignoruj tę wiadomość.</p>
        `
        : undefined,
    });
  }

  async remindPassword(email: string) {
    const user = await this.userRepository.findOne(email);

    if (!user) {
      // Dla bezpieczeństwa możemy nic nie robić, żeby nie ujawniać istnienia konta
      return {
        message:
          'Jeśli użytkownik o takim emailu istnieje, wysłaliśmy instrukcje resetu hasła',
      };
    }

    // Wygeneruj token resetujący
    const resetToken = randomUUID();

    // Ustaw token i datę wygaśnięcia (np. 1 godzina)
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpires = Date.now() + 1000 * 60 * 60; // 1h

    await user.save();

    // Wyślij maila z linkiem resetującym
    await this.sendMailWithToken(
      email,
      resetToken,
      'Reset hasła',
      'password-reset', // jeśli masz template, jeśli nie to undefined
      {}, // dodatkowe dane do templatu, jeśli trzeba
      'http://localhost:3000', // adres frontend do resetu
      'token',
      '/reset-password', // endpoint frontend do resetu hasła
    );
  }
}
