import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserrepositoryService } from './userrepository/userrepository.service';
import { randomUUID } from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from './userrepository/user.schema';

@Injectable()
export class AppService {
  constructor(
    private userRepository: UserrepositoryService,
    @Inject('JWT_ACCESS_SERVICE')
    private readonly accessTokenService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshTokenService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async register(email: string, password: string): Promise<void> {
    const existingUser = await this.userRepository.findOne(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword: string = await bcrypt.hash(password, 10); // 10 salt rounds

    this.sendToken(email);

    await this.userRepository.insertOne({
      email,
      password: hashedPassword,
    });
  }

  async sendToken(email: string) {
    const existingUser = await this.userRepository.findOne(email);
    if (!existingUser) {
      throw new ConflictException('User not found');
    }

    const verificationToken = randomUUID();
    existingUser.verificationToken = verificationToken;
    await existingUser.save();

    //! nie wiem czy jak wysłane z telefonu to przyjdzie na ten adres
    const verificationUrl = `http://localhost:3000/verify/${verificationToken}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Aktywuj swoje konto',
      template: './verification', // tylko jeśli korzystasz z template engine (np. Handlebars)
      html: `
        <h3>Witaj!</h3>
        <p>Kliknij poniższy link, aby aktywować swoje konto:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>Jeśli to nie Ty tworzyłeś konto, zignoruj tę wiadomość.</p>
      `,
    });
  }

  async sendEmailToken(toEmail: string, token: string) {
    const frontendUrl = 'http://localhost:3000'; // adres frontend do potwierdzania maila
    const confirmationLink = `${frontendUrl}/confirm-email-change?token=${token}`;

    await this.mailerService.sendMail({
      to: toEmail,
      subject: 'Potwierdź zmianę adresu email',
      template: 'email-change-confirmation', // np. szablon e-mail (w folderze mail templates)
      context: {
        confirmationLink,
      },
    });
  }

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

    await this.sendEmailToken(newEmail, verificationToken);
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

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userRepository.findOne(email); //* find a user with a provided email
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Nie zweryfikowano konta');
    }
    //* check if the password matches
    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }
    //* if the user is found and the password matches, generate a JWT token and send it back
    const payload = {
      email: user.email,
    };

    const access_token = await this.accessTokenService.signAsync(payload);
    const refresh_token = await this.refreshTokenService.signAsync(payload);

    // const refresh_token = await this.jwtService.signAsync(payload, {
    //   secret: jwtConstants.secret,
    //   expiresIn: RefreshLifespan,
    // });

    //* zapisz refresh token do bazy
    await this.userRepository.addRefreshToken(user.email, refresh_token);

    return {
      access_token,
      refresh_token,
    };
  }

  ///*

  async refreshTokens(
    refresh_token: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const refreshPayload =
        await this.refreshTokenService.verifyAsync(refresh_token);
      const user = await this.userRepository.findOne(refreshPayload.email);

      if (!user || !user.refreshtokens?.includes(refresh_token)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { email: user.email };
      const newAccessToken =
        await this.accessTokenService.signAsync(newPayload);
      const newRefreshToken =
        await this.refreshTokenService.signAsync(newPayload);

      await this.userRepository.replaceRefreshToken(
        user.email,
        refresh_token,
        newRefreshToken,
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (err) {
      throw new UnauthorizedException('Could not refresh tokens');
    }
  }

  async logout(refresh_token: string) {
    try {
      const payload = await this.refreshTokenService.verifyAsync(refresh_token);
      await this.userRepository.removeRefreshToken(
        payload.email,
        refresh_token,
      );
    } catch (err) {
      console.warn('Logout error:', err.message);
      // Możesz rzucić wyjątek lub nie
    }
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ) {
    //todo: sprawdź, czy nowe hasło spełnia warunki haseł

    const user = await this.userRepository.findOne(email);
    if (!user) {
      throw new ConflictException('Użytkownik o podanym mailu nie istnieje');
    }

    const isPasswordValid: string = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Obecne hasło jest nieprawidłowe');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await user.save();
  }
}
