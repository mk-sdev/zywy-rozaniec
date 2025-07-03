import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { jwtConstants } from './config/jwt.constants';
import { UserrepositoryModule } from './userrepository/userrepository.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailModule } from './mail/mail.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // pozwala korzystać z process.env w całej aplikacji
    }),
    UserrepositoryModule,
    MongooseModule.forRoot('mongodb://localhost:27017/imagehub'),
    JwtModule.register({
      global: true,
      secret: jwtConstants.accessSecret,
      signOptions: { expiresIn: jwtConstants.accessExpiresIn },
    }),
    MailerModule.forRoot({
      transport: {
        host: 'sandbox.smtp.mailtrap.io',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '"Twoja Apka" <no-reply@twoja-apka.pl>',
      },
    }),
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'JWT_ACCESS_SERVICE',
      useFactory: () => {
        return new JwtService({
          secret: jwtConstants.accessSecret,
          signOptions: { expiresIn: jwtConstants.accessExpiresIn },
        });
      },
    },
    {
      provide: 'JWT_REFRESH_SERVICE',
      useFactory: () => {
        return new JwtService({
          secret: jwtConstants.refreshSecret,
          signOptions: { expiresIn: jwtConstants.refreshExpiresIn },
        });
      },
    },
  ],
  exports: ['JWT_ACCESS_SERVICE', 'JWT_REFRESH_SERVICE'],
})
export class AppModule {}
