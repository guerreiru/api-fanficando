jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));
jest.mock('../infrastructure/refresh-token.repository', () => ({
  RefreshTokenRepository: class RefreshTokenRepository {},
}));
jest.mock('../infrastructure/jwt-access.service', () => ({
  JwtAccessService: class JwtAccessService {},
}));

import { AUTH_ERROR } from '../domain/auth.errors';
import { SessionService } from './session.service';

describe('SessionService', () => {
  const refreshTokens = {
    findByTokenHash: jest.fn(),
    rotate: jest.fn(),
    revokeAllByUserId: jest.fn(),
    revokeByTokenHash: jest.fn(),
    create: jest.fn(),
  };
  const jwtAccess = {
    sign: jest.fn().mockResolvedValue('access.jwt'),
    verify: jest.fn(),
  };
  const config = {
    get: jest.fn((_key: string, fallback: string) => fallback),
  };

  const service = new SessionService(
    refreshTokens as never,
    jwtAccess as never,
    config as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jwtAccess.sign.mockResolvedValue('access.jwt');
    config.get.mockImplementation((_key: string, fallback: string) => fallback);
  });

  it('revokes every session when a rotated refresh token is reused', async () => {
    refreshTokens.findByTokenHash.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      revokedAt: new Date(),
      replacedByTokenHash: 'old',
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', suspendedAt: null },
    });

    await expect(service.rotate('raw-token', {})).rejects.toMatchObject({
      response: { code: AUTH_ERROR.INVALID_REFRESH },
    });
    expect(refreshTokens.revokeAllByUserId).toHaveBeenCalledWith('user-1');
    expect(refreshTokens.rotate).not.toHaveBeenCalled();
  });

  it('rotates a live refresh token into a new session', async () => {
    refreshTokens.findByTokenHash.mockResolvedValue(liveToken());
    refreshTokens.rotate.mockResolvedValue(true);

    const session = await service.rotate('raw-token', {});

    expect(session).toMatchObject({ accessToken: 'access.jwt' });
    expect(session.refreshToken).not.toBe('raw-token');
    expect(refreshTokens.revokeAllByUserId).not.toHaveBeenCalled();
  });

  it('treats a lost rotation race as reuse and kills every session', async () => {
    refreshTokens.findByTokenHash.mockResolvedValue(liveToken());
    refreshTokens.rotate.mockResolvedValue(false);

    await expect(service.rotate('raw-token', {})).rejects.toMatchObject({
      response: { code: AUTH_ERROR.INVALID_REFRESH },
    });
    expect(refreshTokens.revokeAllByUserId).toHaveBeenCalledWith('user-1');
  });

  it('does not refresh a password account with an unconfirmed email', async () => {
    refreshTokens.findByTokenHash.mockResolvedValue(
      liveToken({ emailVerified: false }),
    );

    await expect(service.rotate('raw-token', {})).rejects.toMatchObject({
      response: { code: AUTH_ERROR.EMAIL_NOT_VERIFIED },
    });
    expect(refreshTokens.rotate).not.toHaveBeenCalled();
  });

  it('refreshes a social account that never confirmed the email', async () => {
    refreshTokens.findByTokenHash.mockResolvedValue(
      liveToken({ emailVerified: false, socialProvider: 'google' }),
    );
    refreshTokens.rotate.mockResolvedValue(true);

    await expect(service.rotate('raw-token', {})).resolves.toMatchObject({
      accessToken: 'access.jwt',
    });
  });

  it('revokes every session when the account is suspended', async () => {
    refreshTokens.findByTokenHash.mockResolvedValue(
      liveToken({ suspendedAt: new Date() }),
    );

    await expect(service.rotate('raw-token', {})).rejects.toMatchObject({
      response: { code: AUTH_ERROR.ACCOUNT_SUSPENDED },
    });
    expect(refreshTokens.revokeAllByUserId).toHaveBeenCalledWith('user-1');
    expect(refreshTokens.rotate).not.toHaveBeenCalled();
  });

  it('rejects an expired refresh token and revokes it', async () => {
    refreshTokens.findByTokenHash.mockResolvedValue({
      ...liveToken(),
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(service.rotate('raw-token', {})).rejects.toMatchObject({
      response: { code: AUTH_ERROR.INVALID_REFRESH },
    });
    expect(refreshTokens.revokeByTokenHash).toHaveBeenCalled();
    expect(refreshTokens.rotate).not.toHaveBeenCalled();
  });

  function liveToken(
    user: Partial<{
      emailVerified: boolean;
      socialProvider: string | null;
      googleId: string | null;
      suspendedAt: Date | null;
    }> = {},
  ) {
    return {
      id: 'rt-1',
      userId: 'user-1',
      revokedAt: null,
      replacedByTokenHash: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-1',
        suspendedAt: null,
        emailVerified: true,
        socialProvider: null,
        googleId: null,
        ...user,
      },
    };
  }
});
