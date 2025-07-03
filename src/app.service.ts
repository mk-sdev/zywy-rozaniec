import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { MailService } from './mail/mail.service';
import { UserrepositoryService } from './userrepository/userrepository.service';
import { JwtPayload } from './utils/interfaces';

@Injectable()
export class AppService {
  constructor(
    private userRepository: UserrepositoryService,
    @Inject('JWT_ACCESS_SERVICE')
    private readonly accessTokenService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshTokenService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(email: string, password: string): Promise<void> {
    const existingUser = await this.userRepository.findOneByEmail(email);
    if (existingUser) {
      // do not do anything to not to reveal the account exists in the db
      // throw new ConflictException('Email already in use');
    }

    // @ts-ignore
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Dodaj użytkownika do bazy
    await this.userRepository.insertOne({
      email,
      password: hashedPassword,
    });

    const newUser = await this.userRepository.findOneByEmail(email);
    if (!newUser) {
      throw new InternalServerErrorException('User creation failed');
    }

    const verificationToken = randomUUID();

    newUser.verificationToken = verificationToken;
    newUser.emailChangeTokenExpires = Date.now() + 1000 * 60 * 60;
    await newUser.save();

    await this.mailService.sendMailWithToken(
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

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userRepository.findOneByEmail(email); //* find a user with a provided email
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
      sub: user._id,
      // email: user.email,
    };

    const access_token = await this.accessTokenService.signAsync(payload);
    const refresh_token = await this.refreshTokenService.signAsync(payload);

    // const refresh_token = await this.jwtService.signAsync(payload, {
    //   secret: jwtConstants.secret,
    //   expiresIn: RefreshLifespan,
    // });

    //* zapisz refresh token do bazy
    await this.userRepository.addRefreshToken(
      user._id as string,
      refresh_token,
    );

    if (user.isDeletionPending) {
      user.isDeletionPending = false;
      user.deletionScheduledAt = undefined;
      await user.save();
    }

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
      const refreshPayload: JwtPayload =
        await this.refreshTokenService.verifyAsync(refresh_token);
      const user = await this.userRepository.findOne(refreshPayload.sub);

      if (!user || !user.refreshtokens?.includes(refresh_token)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { sub: user._id, email: user.email };
      const newAccessToken =
        await this.accessTokenService.signAsync(newPayload);
      const newRefreshToken =
        await this.refreshTokenService.signAsync(newPayload);

      await this.userRepository.replaceRefreshToken(
        user._id as string,
        refresh_token,
        newRefreshToken,
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Could not refresh tokens: ' + err);
    }
  }

  async logout(refresh_token: string) {
    try {
      const payload: JwtPayload =
        await this.refreshTokenService.verifyAsync(refresh_token);
      await this.userRepository.removeRefreshToken(payload.sub, refresh_token);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.warn('Logout error:', err.message);
      // You can throw an error or not
    }
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    //todo: check if the new password meets the conditions
    //todo: delete all the refresh tokens

    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new ConflictException('The user of the given email doesn`t exist');
    }

    const isPasswordValid: string = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await user.save();
  }

  async markForDeletion(id: string, password: string) {
    const user = await this.userRepository.findOne(id);
    if (!user)
      throw new ConflictException('The user of the given email doesn`t exist');

    const isPasswordValid: string = await bcrypt.compare(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.isDeletionPending = true;
    user.deletionScheduledAt = Date.now() + 1000 * 60 * 60 * 24 * 14; // two weeks
    await user.save();
  }
}
