import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './user.schema';
import { RepositoryService } from './repository.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [RepositoryService],
  exports: [RepositoryService],
})
export class UserrepositoryModule {}
