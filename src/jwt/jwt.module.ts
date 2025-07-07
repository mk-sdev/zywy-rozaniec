// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../utils/jwt.constants';

@Module({
  providers: [
    {
      provide: 'JWT_ACCESS_SERVICE',
      useFactory: () => {
        return new JwtService({
          secret: process.env.JWT_ACCESS_SECRET,
          signOptions: { expiresIn: jwtConstants.accessExpiresIn },
        });
      },
    },
    {
      provide: 'JWT_REFRESH_SERVICE',
      useFactory: () => {
        return new JwtService({
          secret: process.env.JWT_REFRESH_SECRET,
          signOptions: { expiresIn: jwtConstants.refreshExpiresIn },
        });
      },
    },
  ],
  exports: ['JWT_ACCESS_SERVICE', 'JWT_REFRESH_SERVICE'],
})
export class JwtModule {}
