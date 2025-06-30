import {
  ConflictException,
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
    private jwtService: JwtService,
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
  ): Promise<{ access_token: string }> {
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

    const access_token = await this.jwtService.signAsync(payload);

    // const refresh_token = await this.jwtService.signAsync(payload, {
    //   secret: jwtConstants.secret,
    //   expiresIn: RefreshLifespan,
    // });

    //* zapisz refresh token do bazy
    //await this.userRepository.updateRefreshToken(user.username, refresh_token);

    return {
      access_token,
      // refresh_token,
    };
  }
}
