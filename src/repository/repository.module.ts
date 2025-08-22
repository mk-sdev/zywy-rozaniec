import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publication } from './publication.entity';
import { PublicationRepositoryService } from './publicationRepository.service';
import { RefreshToken } from './refreshToken.entity';
import { RepositoryService } from './repository.service';
import { User } from './user.entity';
import { Help } from './help.entity';
import { HelpRepositoryService } from './helpRepository.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Publication]),
    TypeOrmModule.forFeature([Help]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([RefreshToken]),
  ],
  providers: [
    RepositoryService,
    PublicationRepositoryService,
    HelpRepositoryService,
  ],
  exports: [
    RepositoryService,
    PublicationRepositoryService,
    HelpRepositoryService,
  ],
})
export class RepositoryModule {}
