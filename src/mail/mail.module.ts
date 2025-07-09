import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { RepositoryModule } from '../repository/repository.module';
import { TokensModule } from '../utils/tokens.module';
import { HashService } from '../hash.service';

@Module({
  imports: [RepositoryModule, TokensModule],
  controllers: [MailController],
  providers: [MailService, HashService],
  exports: [MailService],
})
export class MailModule {}
