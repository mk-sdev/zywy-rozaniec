import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, UserRequest } from './utils/interfaces';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    @Inject('JWT_ACCESS_SERVICE')
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();

    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true;
    } catch (err) {
      // console.error(err);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
