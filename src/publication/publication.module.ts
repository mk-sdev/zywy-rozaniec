import { Module } from '@nestjs/common';
import { PublicationController } from './publication.controller';
import { PublicationService } from './publication.service';
import { RepositoryModule } from '../repository/repository.module';
import { TokensModule } from '../utils/tokens.module';
@Module({
  imports: [RepositoryModule, TokensModule],
  controllers: [PublicationController],
  providers: [PublicationService],
})
export class PublicationModule {}
