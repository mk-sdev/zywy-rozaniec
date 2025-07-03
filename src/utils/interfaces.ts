import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  // email: string;
  iat?: number;
  exp?: number;
}

export interface UserRequest extends Request {
  user?: JwtPayload;
}
