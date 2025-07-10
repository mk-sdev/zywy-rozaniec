import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  // email: string;
}

export interface UserRequest extends Request {
  cookies: { [key: string]: string };
  user?: JwtPayload;
}
