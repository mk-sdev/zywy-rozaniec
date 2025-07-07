import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { UserrepositoryModule } from '../repository/repository.module';
import { TokensModule } from '../utils/tokens.module';

@Module({
  imports: [UserrepositoryModule, TokensModule],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
