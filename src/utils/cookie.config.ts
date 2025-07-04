import { CookieOptions } from 'express';

export const accessTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 10,
};

export const refreshTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 30,
};

export const Accesslifespan = '10m';
export const RefreshLifespan = '30m';
