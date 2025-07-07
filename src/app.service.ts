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
import { RepositoryService } from './repository/repository.service';
import { JwtPayload } from './utils/interfaces';
import {
  account_deletion_lifespan,
  account_verification_lifespan,
} from './utils/constants';

@Injectable()
export class AppService {
  constructor(
    private repositoryService: RepositoryService,
    @Inject('JWT_ACCESS_SERVICE')
    private readonly accessTokenService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshTokenService: JwtService,
    private readonly mailService: MailService,
  ) {}

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
    const user = await this.repositoryService.findOneByEmail(email); //* find a user with a provided email
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
    // * delete expired tokens
    for (const token of user.refreshTokens) {
      const payload: JwtPayload = this.refreshTokenService.decode(token);

      if (payload?.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        await this.repositoryService.removeRefreshToken(
          String(user._id),
          token,
        );
      }
    }

    //* save refresh token to the db
    await this.repositoryService.addRefreshToken(
      user._id as string,
      refresh_token,
    );

    if (user.isDeletionPending) {
      await this.repositoryService.cancelScheduledDeletion(user._id as string);
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
      const user = await this.repositoryService.findOne(refreshPayload.sub);

      if (!user || !user.refreshTokens?.includes(refresh_token)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { sub: user._id, email: user.email };
      const newAccessToken =
        await this.accessTokenService.signAsync(newPayload);
      const newRefreshToken =
        await this.refreshTokenService.signAsync(newPayload);

      await this.repositoryService.replaceRefreshToken(
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
      await this.repositoryService.removeRefreshToken(
        payload.sub,
        refresh_token,
      );
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
    if (currentPassword === newPassword) {
      throw new Error('New password cannot be the same as the old one');
    }

    const user = await this.repositoryService.findOne(id);
    if (!user) {
      throw new ConflictException('The user of the given email doesn`t exist');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.repositoryService.updatePasswordAndClearTokens(
      user.email,
      hashedNewPassword,
    );
  }

  async markForDeletion(id: string, password: string) {
    const user = await this.repositoryService.findOne(id);
    if (!user) {
      throw new ConflictException('The user of the given email doesn`t exist');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const deletionScheduledAt = Date.now() + account_deletion_lifespan;
    await this.repositoryService.markUserForDeletion(
      user.email,
      deletionScheduledAt,
    );
  }
}
