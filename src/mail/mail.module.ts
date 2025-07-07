import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { UserrepositoryModule } from '../userrepository/userrepository.module';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  imports: [UserrepositoryModule, JwtModule],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
