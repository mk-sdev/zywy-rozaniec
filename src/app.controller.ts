import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { LoginDto } from './dtos/login.dto';
import { Id } from './id.decorator';
import { JwtGuard } from './jwt.guard';
import { accessTokenOptions, refreshTokenOptions } from './utils/constants';
import { UserRequest } from './utils/interfaces';
@Controller()
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  fn(): string {
    return 'Serwer się rozgrzał!';
  }

  @Get('hello')
  getHello(): string {
    return 'Hello World!';
  }

  @Patch('login')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token } = await this.appService.login(
      loginDto.email,
      loginDto.password,
    );

    response.cookie('access_token', access_token, accessTokenOptions);
    response.cookie('refresh_token', refresh_token, refreshTokenOptions);

    return { message: 'Login successful' };
  }

  @Patch('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: UserRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh_token = req.cookies?.refresh_token;

    if (!refresh_token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    await this.appService.logout(refresh_token);

    res.clearCookie('access_token', accessTokenOptions);
    res.clearCookie('refresh_token', refreshTokenOptions);

    return { message: 'Logout successful' };
  }

  @Patch('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: UserRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh_token = req.cookies?.refresh_token;

    if (!refresh_token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const refreshed = await this.appService.refreshTokens(refresh_token);

    res.cookie('access_token', refreshed.access_token, accessTokenOptions);
    res.cookie('refresh_token', refreshed.refresh_token, refreshTokenOptions);

    return { message: 'Refresh successful' };
  }

  @Patch('change-password')
  @UseGuards(JwtGuard)
  async changePassword(@Id() id: string, @Body() body: ChangePasswordDto) {
    return this.appService.changePassword(id, body.password, body.newPassword);
  }

  @Delete('delete-account')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async deleteAccount(@Id() id: string, @Body() body: { password: string }) {
    await this.appService.markForDeletion(id, body.password);
  }

  @Get('isLogged')
  @UseGuards(JwtGuard)
  getUserInfo(@Headers('authorization') authHeader: string) {
    return true;
  }
}
