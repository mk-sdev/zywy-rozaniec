import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserrepositoryModule } from './userrepository/userrepository.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    UserrepositoryModule,
    MongooseModule.forRoot('mongodb://localhost:27017/imagehub'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
