import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserrepositoryModule } from './userrepository/userrepository.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Accesslifespan } from './config/cookie.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // pozwala korzystać z process.env w całej aplikacji
    }),
    UserrepositoryModule,
    MongooseModule.forRoot('mongodb://localhost:27017/imagehub'),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: Accesslifespan },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
