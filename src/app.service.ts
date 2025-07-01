import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserrepositoryService } from './userrepository/userrepository.service';

@Injectable()
export class AppService {
  constructor(
    private userRepository: UserrepositoryService,
    @Inject('JWT_ACCESS_SERVICE')
    private readonly accessTokenService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshTokenService: JwtService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  async register(email: string, password: string): Promise<void> {
    const existingUser = await this.userRepository.findOne(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword: string = await bcrypt.hash(password, 10); // 10 salt rounds

    await this.userRepository.insertOne({
      email,
      password: hashedPassword,
    });
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userRepository.findOne(email); //* find a user with a provided email
    if (!user) {
      throw new UnauthorizedException();
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
