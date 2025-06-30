import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
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
}
