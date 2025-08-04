import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from './user.entity';
import { Publication } from './publication.entity';
import { RepositoryService } from './repository.service';
import { PublicationRepositoryService } from './publicationRepository.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Publication]),
    TypeOrmModule.forFeature([User]),
    // MongooseModule.forFeature([
    //   { name: 'Publication', schema: PublicationSchema },
    // ]),
  ],
  providers: [RepositoryService, PublicationRepositoryService],
  exports: [RepositoryService, PublicationRepositoryService],
})
export class RepositoryModule {}
