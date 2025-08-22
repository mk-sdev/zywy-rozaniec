import { Module } from '@nestjs/common';
import { HelpController } from './help.controller';
import { TokensModule } from 'src/utils/tokens.module';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [RepositoryModule, TokensModule],
  controllers: [HelpController],
})
export class HelpModule {}
