import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body;
    const refreshed = await this.appService.refreshTokens(
      // access_token,
      refresh_token,
    );

    return {
      message: 'Refresh successful',
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: Record<string, any>) {
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body;
    await this.appService.logout(refresh_token);
    return { message: 'Logout successful' };
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
    if (
      !token ||
      token === 'null' ||
      token === 'undefined' ||
      token.trim() === ''
    ) {
      throw new UnauthorizedException('Missing or invalid token');
    }

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
