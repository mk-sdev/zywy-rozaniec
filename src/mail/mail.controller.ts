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
import { JwtGuard } from 'src/jwt.guard';
import { MailService } from './mail.service';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('verify-account/:token')
  async verify(@Param('token') token: string) {
    const user = await this.mailService.verifyToken(token);
    return {
      message: 'Konto zostało pomyślnie aktywowane',
    };
  }

  @Patch('change-email')
  @UseGuards(JwtGuard)
  async changeEmail(
    @Req() req,
    @Body() body: { newEmail: string; password: string },
  ) {
    const currentEmail: string = req.user.email;
    const { newEmail, password } = body;

    this.mailService.changeEmail(currentEmail, newEmail, password);

    return { message: 'Email został zmieniony pomyślnie' };
  }

  @Patch('verify-email')
  async confirmEmailChange(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token jest wymagany');
    }

    // Wywołaj logikę serwisową potwierdzającą token
    await this.mailService.confirmEmailChange(token);

    return { message: 'Email został pomyślnie zweryfikowany i zmieniony' };
  }

  @Post('remind-password')
  @HttpCode(HttpStatus.OK)
  async remindPassword(@Body() body: { email: string }) {
    const { email } = body;

    await this.mailService.remindPassword(email);
    return {
      message:
        'Jeśli użytkownik o takim emailu istnieje, wysłaliśmy instrukcje resetu hasła',
    };
  }
}
