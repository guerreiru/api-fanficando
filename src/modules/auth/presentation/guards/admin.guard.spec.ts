import { HttpException, type ExecutionContext } from '@nestjs/common';
import { AUTH_ERROR } from '../../domain/auth.errors';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows an admin', () => {
    expect(guard.canActivate(contextOf({ id: 'user-1', isAdmin: true }))).toBe(
      true,
    );
  });

  it('rejects a logged in user without the admin role', () => {
    expect(codeThrownBy({ id: 'user-1', isAdmin: false })).toBe(
      AUTH_ERROR.ADMIN_REQUIRED,
    );
  });

  it('rejects a request without a session', () => {
    expect(codeThrownBy(undefined)).toBe(AUTH_ERROR.UNAUTHENTICATED);
  });

  type GuardUser = { id: string; isAdmin: boolean } | undefined;

  function codeThrownBy(user: GuardUser): string | undefined {
    try {
      guard.canActivate(contextOf(user));
      return undefined;
    } catch (error) {
      const response =
        error instanceof HttpException ? error.getResponse() : undefined;
      return typeof response === 'object' && response !== null
        ? (response as { code?: string }).code
        : undefined;
    }
  }

  function contextOf(user: GuardUser): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }
});
