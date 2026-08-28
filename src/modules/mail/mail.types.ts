export type MailSendPayload = {
  to: string;
  subject: string;
  html: string;
};

export type MailProvider = {
  send(payload: MailSendPayload): Promise<unknown>;
};

export type MailSendResult = { sent: true } | { skipped: true; reason: string };

export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');
