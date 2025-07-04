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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Id } from '../id.decorator';
import { JwtGuard } from '../jwt.guard';
import { MailService } from './mail.service';
import { ChangeEmailDto } from '../dtos/changeEmail.dto';
import { EmailDto } from '../dtos/email.dto';

@Controller()
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
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
  async changeEmail(@Id() id: string, @Body() body: ChangeEmailDto) {
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
  async remindPassword(@Body() body: EmailDto) {
    const { email } = body;

    const message =
      'Password reset instruction has been sent to the email address provided';

    await this.mailService.remindPassword(email, message);
    return {
      message,
    };
  }
}
