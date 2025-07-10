import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './user.schema';
import { PublicationSchema } from './publication.schema';
import { RepositoryService } from './repository.service';
import { PublicationRepositoryService } from './publicationRepository.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: 'Publication', schema: PublicationSchema },
    ]),
  ],
  providers: [RepositoryService, PublicationRepositoryService],
  exports: [RepositoryService, PublicationRepositoryService],
})
export class RepositoryModule {}
