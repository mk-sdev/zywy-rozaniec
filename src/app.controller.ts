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
import { UserRequest } from './utils/interfaces';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { JwtGuard } from './jwt.guard';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { Id } from './id.decorator';
@Controller()
@UsePipes(ValidationPipe)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): string {
    return 'Hello World!';
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
  async register(@Body() registerDto: RegisterDto) {
    const message = 'Verification link has been sent to your email address';
    await this.appService.register(registerDto.email, registerDto.password);
    return { message };
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
  async changePassword(@Id() id: string, @Body() body: ChangePasswordDto) {
    return this.appService.changePassword(id, body.password, body.newPassword);
  }

  @Delete('delete-account')
  @UseGuards(JwtGuard)
  async deleteAccount(@Id() id: string, @Body() body: { password: string }) {
    await this.appService.markForDeletion(id, body.password);
  }

  //* dev
  @Get('userinfo')
  getUserInfo(@Headers('authorization') authHeader: string) {
    // Check if there is a header and whether it is in the "bearer token" format
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

    return {
      id: 123,
      name: 'Jan Kowalski',
      email: 'jan.kowalski@example.com',
      tokenReceived: token,
    };
  }
}
