import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { JwtGuard } from './jwt.guard';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
@Controller()
@UsePipes(ValidationPipe)
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  async register(@Body() registerDto: RegisterDto) {
    await this.appService.register(registerDto.email, registerDto.password);
    return {
      message: 'User registered successfully',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token } = await this.appService.signIn(
      loginDto.email,
      loginDto.password,
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

  @Patch('change-password')
  @UseGuards(JwtGuard)
  async changePassword(
    @Req() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const userEmail: string = req.user.email;
    return this.appService.changePassword(
      userEmail,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Patch('change-email')
  @UseGuards(JwtGuard)
  async changeEmail(
    @Req() req,
    @Body() body: { currentEmail: string; newEmail: string; password: string },
  ) {
    const userEmail: string = req.user.email;
    throw new Error('Niedokończona metoda');
  }

  @Delete('delete-account')
  @UseGuards(JwtGuard)
  async deleteAccount(@Req() req, @Body() body: { password: string }) {
    const userEmail: string = req.user.email;
    throw new Error('Niedokończona metoda');
  }

  @Post('remind-password')
  @HttpCode(HttpStatus.OK)
  async remindPassword(@Body() body: { email: string }) {
    const userEmail = body.email;
    throw new Error('Niedokończona metoda');
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
