import { CookieOptions } from 'express';

export const accessTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: true, // << MUSI być true, bo SameSite: 'none'
  sameSite: 'none', // << MUSI być none dla cross-origin
  maxAge: 1000 * 60 * 15,
};

export const refreshTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

// access jwt lifespan
export const access_jwt_lifespan = '15m';
// refresh jwt lifespan
export const refresh_jwt_lifespan = '7d';
