jest.mock('../../infrastructure/auth-user.repository', () => ({
  AuthUserRepository: class AuthUserRepository {},
}));
jest.mock('../../infrastructure/jwt-access.service', () => ({
  JwtAccessService: class JwtAccessService {},
}));

import type { ExecutionContext } from '@nestjs/common';
import { AUTH_ERROR, unauthenticated } from '../../domain/auth.errors';
import { AuthGuard } from './auth.guard';

type GuardRequest = {
  cookies?: Record<string, unknown>;
  headers?: Record<string, string | undefined>;
  user?: { id: string; isAdmin: boolean };
};

describe('AuthGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const jwtAccess = { verify: jest.fn() };
  const users = { findAuthContext: jest.fn() };

  const guard = new AuthGuard(
    reflector as never,
    jwtAccess as never,
    users as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('rejects a protected route without a token', async () => {
    await expect(guard.canActivate(contextFor({}))).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('rejects an invalid access token', async () => {
    jwtAccess.verify.mockRejectedValue(unauthenticated());

    await expect(
      guard.canActivate(contextFor({ cookie: 'broken.jwt' })),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('attaches the user from the access cookie', async () => {
    jwtAccess.verify.mockResolvedValue('user-1');
    users.findAuthContext.mockResolvedValue(authContext());

    const request: GuardRequest = { cookies: { access_token: 'a.jwt' } };
    await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1', isAdmin: false });
  });

  it('accepts the Bearer header when there is no cookie', async () => {
    jwtAccess.verify.mockResolvedValue('user-1');
    users.findAuthContext.mockResolvedValue(authContext());

    const request: GuardRequest = {
      headers: { authorization: 'Bearer a.jwt' },
    };
    await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
    expect(jwtAccess.verify).toHaveBeenCalledWith('a.jwt');
  });

  it('rejects a token whose user no longer exists', async () => {
    jwtAccess.verify.mockResolvedValue('ghost');
    users.findAuthContext.mockResolvedValue(null);

    await expect(
      guard.canActivate(contextFor({ cookie: 'a.jwt' })),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('blocks a suspended account on a protected route', async () => {
    jwtAccess.verify.mockResolvedValue('user-1');
    users.findAuthContext.mockResolvedValue(
      authContext({ suspendedAt: new Date() }),
    );

    await expect(
      guard.canActivate(contextFor({ cookie: 'a.jwt' })),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.ACCOUNT_SUSPENDED },
    });
  });

  it('blocks a password account that never confirmed the email', async () => {
    jwtAccess.verify.mockResolvedValue('user-1');
    users.findAuthContext.mockResolvedValue(
      authContext({ emailVerified: false }),
    );

    await expect(
      guard.canActivate(contextFor({ cookie: 'a.jwt' })),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.EMAIL_NOT_VERIFIED },
    });
  });

  it('allows a social account that never confirmed the email', async () => {
    jwtAccess.verify.mockResolvedValue('user-1');
    users.findAuthContext.mockResolvedValue(
      authContext({ emailVerified: false, socialProvider: 'google' }),
    );

    await expect(
      guard.canActivate(contextFor({ cookie: 'a.jwt' })),
    ).resolves.toBe(true);
  });

  it('lets a suspended user reach public routes such as logout', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    jwtAccess.verify.mockResolvedValue('user-1');
    users.findAuthContext.mockResolvedValue(
      authContext({ suspendedAt: new Date() }),
    );

    const request: GuardRequest = { cookies: { access_token: 'a.jwt' } };
    await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('lets an unverified user reach public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    jwtAccess.verify.mockResolvedValue('user-1');
    users.findAuthContext.mockResolvedValue(
      authContext({ emailVerified: false }),
    );

    const request: GuardRequest = { cookies: { access_token: 'a.jwt' } };
    await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  function authContext(
    overrides: Partial<{
      suspendedAt: Date | null;
      emailVerified: boolean;
      socialProvider: string | null;
      googleId: string | null;
    }> = {},
  ) {
    return {
      id: 'user-1',
      isAdmin: false,
      suspendedAt: null,
      emailVerified: true,
      socialProvider: null,
      googleId: null,
      ...overrides,
    };
  }

  function contextFor(options: { cookie?: string; bearer?: string }) {
    return contextOf({
      cookies: options.cookie ? { access_token: options.cookie } : undefined,
      headers: options.bearer
        ? { authorization: `Bearer ${options.bearer}` }
        : {},
    });
  }

  function contextOf(request: Partial<GuardRequest>): ExecutionContext {
    const full = request as GuardRequest;
    full.headers ??= {};
    return {
      switchToHttp: () => ({ getRequest: () => full }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }
});
