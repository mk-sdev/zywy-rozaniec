import { Accesslifespan, RefreshLifespan } from './cookie.config';

export const jwtConstants = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  accessExpiresIn: Accesslifespan,
  refreshExpiresIn: RefreshLifespan,
};
