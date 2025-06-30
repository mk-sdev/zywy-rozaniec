import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Redirect,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { accessTokenOptions } from './config/cookie.config';
import { Response } from 'express';
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
  @Redirect('profile')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: Record<string, any>,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token } = await this.appService.signIn(
      signInDto.email,
      signInDto.password,
    );

    response.cookie('jwt', access_token, accessTokenOptions);

    // response.cookie('refresh', refresh_token, refreshTokenOptions);

    return { message: 'Login successful' };
  }
}
