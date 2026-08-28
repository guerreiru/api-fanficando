import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import type { MailProvider } from './mail.types';

export const DEFAULT_RESEND_FROM = 'Fanficando <no-reply@fanficando.com>';

export function createMailProvider(config: ConfigService): MailProvider | null {
  const apiKey = String(config.get<string>('RESEND_API_KEY') || '').trim();
  if (!apiKey) {
    return null;
  }

  const resend = new Resend(apiKey);
  const from =
    String(config.get<string>('RESEND_FROM') || '').trim() ||
    DEFAULT_RESEND_FROM;

  return {
    async send(payload) {
      await resend.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
    },
  };
}
