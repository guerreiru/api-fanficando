jest.mock('../infrastructure/refresh-token.repository', () => ({
  RefreshTokenRepository: class RefreshTokenRepository {},
}));
jest.mock('../infrastructure/auth-user.repository', () => ({
  AuthUserRepository: class AuthUserRepository {},
}));
jest.mock('../infrastructure/email-verification-token.repository', () => ({
  EmailVerificationTokenRepository: class EmailVerificationTokenRepository {},
}));

import { Logger } from '@nestjs/common';
import { EMAIL_VERIFICATION_TTL_MS } from '../domain/auth.constants';
import { SessionCleanupService } from './session-cleanup.service';

describe('SessionCleanupService', () => {
  const refreshTokens = { deleteExpiredBefore: jest.fn() };
  const users = { deleteUnverifiedRegistrations: jest.fn() };
  const emailVerificationTokens = { deleteExpiredBefore: jest.fn() };
  const config = { get: jest.fn() };

  const service = new SessionCleanupService(
    refreshTokens as never,
    users as never,
    emailVerificationTokens as never,
    config as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    refreshTokens.deleteExpiredBefore.mockResolvedValue(0);
    users.deleteUnverifiedRegistrations.mockResolvedValue(0);
    emailVerificationTokens.deleteExpiredBefore.mockResolvedValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('purges sessions, abandoned registrations and email tokens', async () => {
    refreshTokens.deleteExpiredBefore.mockResolvedValue(3);
    users.deleteUnverifiedRegistrations.mockResolvedValue(2);
    emailVerificationTokens.deleteExpiredBefore.mockResolvedValue(5);

    await expect(service.purge()).resolves.toEqual({
      refreshTokens: 3,
      unverifiedRegistrations: 2,
      emailVerificationTokens: 5,
    });
  });

  it('frees a registration only after the verification token TTL', async () => {
    const before = Date.now();

    await service.purge();

    const [params] = users.deleteUnverifiedRegistrations.mock.calls[0] as [
      { createdBefore: Date; abandonedBefore: Date; now: Date },
    ];
    expect(params.now.getTime()).toBeGreaterThanOrEqual(before);
    expect(params.now.getTime() - params.createdBefore.getTime()).toBe(
      EMAIL_VERIFICATION_TTL_MS,
    );
  });

  it('caps how long an unconfirmed registration can hold the email', async () => {
    await service.purge();

    const [params] = users.deleteUnverifiedRegistrations.mock.calls[0] as [
      { abandonedBefore: Date; now: Date },
    ];
    expect(params.now.getTime() - params.abandonedBefore.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });

  it('keeps purging the rest when one sweep fails', async () => {
    refreshTokens.deleteExpiredBefore.mockRejectedValue(new Error('db down'));
    users.deleteUnverifiedRegistrations.mockResolvedValue(1);
    emailVerificationTokens.deleteExpiredBefore.mockResolvedValue(4);

    await expect(service.purge()).resolves.toEqual({
      refreshTokens: 0,
      unverifiedRegistrations: 1,
      emailVerificationTokens: 4,
    });
  });

  it('does not schedule the timer in the test environment', () => {
    config.get.mockReturnValue('test');

    service.onApplicationBootstrap();

    expect(refreshTokens.deleteExpiredBefore).not.toHaveBeenCalled();
  });
});
