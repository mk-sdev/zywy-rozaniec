import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { JwtPayload } from './utils/interfaces';

// helper type to mock the request from the header
interface MockRequest {
  headers: Record<string, string>;
  user?: JwtPayload;
}

// helper type to mock ExecutionContext
const createMockContext = (
  headers: Record<string, string>,
): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }) as MockRequest,
    }),
  } as unknown as ExecutionContext;
};

describe('JwtGuard', () => {
  let jwtService: JwtService;
  let guard: JwtGuard;

  beforeEach(() => {
    jwtService = new JwtService({});
    guard = new JwtGuard(jwtService);
  });

  it('should return true for valid token', async () => {
    const mockPayload: JwtPayload = {
      sub: 'user123',
    };

    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

    const mockRequest: MockRequest = {
      headers: { authorization: 'Bearer valid.token' },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockRequest.user).toEqual(mockPayload);
  });

  it('should throw UnauthorizedException if no token provided', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if token is invalid', async () => {
    jest
      .spyOn(jwtService, 'verifyAsync')
      .mockRejectedValue(new Error('Invalid token'));

    const context = createMockContext({
      authorization: 'Bearer invalid.token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid.token');
  });
});
