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
  UseGuards
} from '@nestjs/common';
import { Id } from 'src/id.decorator';
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
    @Id() id: string,
    @Body() body: { newEmail: string; password: string },
  ) {
    const { newEmail, password } = body;

    await this.mailService.changeEmail(id, newEmail, password);

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
