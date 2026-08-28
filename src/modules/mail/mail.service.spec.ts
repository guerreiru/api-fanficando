jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { MailService } from './mail.service';

describe('MailService', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') {
        return 'http://localhost:5173';
      }
      return undefined;
    }),
  };

  it('skips sending when the provider is not configured', async () => {
    const service = new MailService(config as never, null);

    await expect(
      service.sendVerificationEmail({ to: 'a@test.com', token: 'abc' }),
    ).resolves.toEqual({ skipped: true, reason: 'provider_unconfigured' });
  });

  it('sends through the provider when it is configured', async () => {
    const provider = { send: jest.fn().mockResolvedValue(undefined) };
    const service = new MailService(config as never, provider);

    await expect(
      service.sendPasswordResetEmail({ to: 'a@test.com', token: 'abc' }),
    ).resolves.toEqual({ sent: true });
    expect(provider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@test.com',
        subject: 'Redefinir sua senha — Fanficando',
      }),
    );
  });
});
