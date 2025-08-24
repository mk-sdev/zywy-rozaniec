import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashService } from './hash.service';
import { RepositoryService } from './repository/repository.service';
import { JwtPayload } from './utils/interfaces';

@Injectable()
export class AppService {
  constructor(
    private repositoryService: RepositoryService,
    @Inject('JWT_ACCESS_SERVICE')
    private readonly accessTokenService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshTokenService: JwtService,
    private readonly hashService: HashService,
  ) {}

  async register(login: string, password: string): Promise<void> {
    const existingUser = await this.repositoryService.findOneByLogin(login);
    if (existingUser) {
      // do not do anything to not to reveal the account exists in the db
      return;
    }

    const hashedPassword = await this.hashService.hash(password); // 10 salt rounds

    // Add the user to the db
    await this.repositoryService.insertOne({
      login,
      password: hashedPassword,
    });
  }

  async login(
    login: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.repositoryService.findOneByLogin(login); //* find a user with a provided login
    if (!user) {
      throw new UnauthorizedException();
    }
    // if (!user.isVerified) {
    //   throw new UnauthorizedException('Nie zweryfikowano konta');
    // }
    //* check if the password matches
    const isPasswordValid: boolean = await this.hashService.verify(
      user.password,
      password,
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

    const hashedRefreshToken: string =
      await this.hashService.hash(refresh_token);

    //* save refresh token to the db
    await this.repositoryService.addRefreshToken(user._id, hashedRefreshToken);

    await this.repositoryService.trimRefreshTokens(String(user._id), 5);

    // if (user.isDeletionPending) {
    //   await this.repositoryService.cancelScheduledDeletion(user._id as string);
    // }

    return {
      access_token,
      refresh_token,
    };
  }

  async logout(refresh_token: string) {
    try {
      const payload: JwtPayload =
        await this.refreshTokenService.verifyAsync(refresh_token);

      //get the user
      const user = await this.repositoryService.findOne(payload.sub);
      //iterate over its refreshTokens
      if (!user) throw new UnauthorizedException('Invalid refresh token');
      for (const hashedToken of user.refreshTokens) {
        //compare via this.hashService.verify
        const isMatch = await this.hashService.verify(
          hashedToken.token,
          refresh_token,
        );
        if (isMatch) {
          //removed the token from the db
          await this.repositoryService.removeRefreshToken(
            payload.sub, //
            hashedToken.token,
          );
        }
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.warn('Logout error:', err.message);
    }
  }

  // creates both new access and refresh tokens
  async refreshTokens(
    refresh_token: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const refreshPayload: JwtPayload =
        await this.refreshTokenService.verifyAsync(refresh_token);
      const user = await this.repositoryService.findOne(refreshPayload.sub);

      if (!user) throw new UnauthorizedException('Invalid refresh token');

      const newPayload = { sub: user._id, login: user.login };
      const newAccessToken =
        await this.accessTokenService.signAsync(newPayload);
      const newRefreshToken =
        await this.refreshTokenService.signAsync(newPayload);

      const newHashedRefreshToken =
        await this.hashService.hash(newRefreshToken);

      let validTokenFound = false;

      for (const hashedToken of user.refreshTokens) {
        const isMatch = await this.hashService.verify(
          hashedToken.token, //! previously hashedToken
          refresh_token,
        );
        if (isMatch) {
          validTokenFound = true;
          await this.repositoryService.replaceRefreshToken(
            user._id,
            hashedToken.token,
            newHashedRefreshToken,
          );
          break;
        }
      }

      if (!validTokenFound) {
        throw new UnauthorizedException('Refresh token not recognized');
      }

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Could not refresh tokens: ' + err);
    }
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (currentPassword === newPassword) {
      console.log('New password cannot be the same as the old one');
      throw new Error('New password cannot be the same as the old one');
    }

    const user = await this.repositoryService.findOne(id);
    if (!user) {
      console.log('The user of the given email doesn`t exist');
      throw new ConflictException('The user of the given email doesn`t exist');
    }

    const isPasswordValid = await this.hashService.verify(
      user.password,
      currentPassword,
    );
    if (!isPasswordValid) {
      console.log('Current password is incorrect');
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await this.hashService.hash(newPassword);
    await this.repositoryService.updatePassword(user.login, hashedNewPassword);
  }

  async getUserById(id: string) {
    const user = await this.repositoryService.findOne(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
