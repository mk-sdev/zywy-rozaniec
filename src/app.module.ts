import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HashService } from './hash.service';
import { PublicationModule } from './publication/publication.module';
import { RepositoryModule } from './repository/repository.module';
import { TokensModule } from './utils/tokens.module';
import { AppDataSource } from 'data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // lets use process.env in the whole app
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 20,
        },
      ],
    }),
    PublicationModule,
    RepositoryModule,
    TokensModule,
    JwtModule,
  ],
  controllers: [AppController],
  providers: [
    HashService,
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
