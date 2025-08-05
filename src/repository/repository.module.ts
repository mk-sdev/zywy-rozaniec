import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publication } from './publication.entity';
import { PublicationRepositoryService } from './publicationRepository.service';
import { RefreshToken } from './refreshToken.entity';
import { RepositoryService } from './repository.service';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Publication]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([RefreshToken]),
  ],
  providers: [RepositoryService, PublicationRepositoryService],
  exports: [RepositoryService, PublicationRepositoryService],
})
export class RepositoryModule {}
