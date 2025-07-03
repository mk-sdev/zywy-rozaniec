import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRequest } from 'src/utils/interfaces';
import { JwtGuard } from 'src/jwt.guard';
import { MailService } from './mail.service';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('verify-account/:token')
  async verify(@Param('token') token: string) {
    await this.mailService.verifyToken(token);
    return {
      message: 'The account has been verified successfully',
    };
  }

  @Patch('change-email')
  @UseGuards(JwtGuard)
  async changeEmail(
    @Req() req: UserRequest,
    @Body() body: { newEmail: string; password: string },
  ) {
    const currentEmail: string = req.user!.email;
    const { newEmail, password } = body;

    await this.mailService.changeEmail(currentEmail, newEmail, password);

    return { message: 'Email address has been changed successfully' };
  }

  @Patch('verify-email')
  async confirmEmailChange(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    await this.mailService.confirmEmailChange(token);

    return { message: 'Email has been successfully verified and changed' };
  }

  @Post('remind-password')
  @HttpCode(HttpStatus.OK)
  async remindPassword(@Body() body: { email: string }) {
    const { email } = body;

    const message =
      'Password reset instruction has been sent to the email address provided';

    await this.mailService.remindPassword(email, message);
    return {
      message,
    };
  }
}
