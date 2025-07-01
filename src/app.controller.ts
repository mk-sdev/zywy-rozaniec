import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: Record<string, any>) {
    // Here you would typically call a user service to create a new user
    // For simplicity, we are just returning the registration data
    await this.appService.register(registerDto.email, registerDto.password);
    return {
      message: 'User registered successfully',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: Record<string, any>,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token } = await this.appService.signIn(
      signInDto.email,
      signInDto.password,
    );

    response.setHeader('Authorization', `Bearer ${access_token}`);
    // response.setHeader('X-Refresh-Token', refresh_token);

    return { message: 'Login successful', refresh_token };
  }

  //* dev
  @Get('userinfo')
  getUserInfo(@Headers('authorization') authHeader: string) {
    // Sprawdź czy jest nagłówek i czy jest w formacie "Bearer token"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    // Dla uproszczenia nie weryfikujemy tokena, tylko zwracamy dane "na sztywno"
    // W prawdziwej aplikacji byś tu zweryfikował token JWT itd.

    return {
      id: 123,
      name: 'Jan Kowalski',
      email: 'jan.kowalski@example.com',
      tokenReceived: token, // żeby widzieć jaki token przyszło
    };
  }
}
