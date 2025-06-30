import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './user.schema';
import { UserrepositoryService } from './userrepository.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [UserrepositoryService],
  exports: [UserrepositoryService],
})
export class UserrepositoryModule {}
