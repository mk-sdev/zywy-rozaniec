import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserrepositoryModule } from './userrepository/userrepository.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UserrepositoryModule,
    MongooseModule.forRoot('mongodb://localhost:27017/imagehub'),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      // signOptions: { expiresIn: '3600s' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
