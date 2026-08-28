import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildFrontendTokenUrl,
  resolveEmailLogoUrl,
  resolveEmailSiteUrl,
} from './mail.branding';
import {
  MAIL_PROVIDER,
  type MailProvider,
  type MailSendResult,
} from './mail.types';
import {
  buildChangeEmailHtml,
  formatChangeEmailSubject,
} from './templates/change-email.template';
import {
  buildResetPasswordHtml,
  formatResetPasswordSubject,
} from './templates/reset-password.template';
import {
  buildVerifyEmailHtml,
  formatVerifyEmailSubject,
} from './templates/verify-email.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(MAIL_PROVIDER)
    private readonly provider: MailProvider | null,
  ) {}

  sendVerificationEmail(payload: { to: string; token: string }) {
    return this.dispatch({
      to: payload.to,
      subject: formatVerifyEmailSubject(),
      html: buildVerifyEmailHtml({
        verifyUrl: this.tokenUrl('/verify-email', payload.token),
        logoUrl: this.logoUrl(),
        siteUrl: this.siteUrl(),
        recipientEmail: payload.to,
      }),
      missingKeyWarning: `RESEND_API_KEY ausente — e-mail de verificação não enviado para ${payload.to}`,
    });
  }

  sendPasswordResetEmail(payload: { to: string; token: string }) {
    return this.dispatch({
      to: payload.to,
      subject: formatResetPasswordSubject(),
      html: buildResetPasswordHtml({
        resetUrl: this.tokenUrl('/reset-password', payload.token),
        logoUrl: this.logoUrl(),
        siteUrl: this.siteUrl(),
        recipientEmail: payload.to,
      }),
      missingKeyWarning: `RESEND_API_KEY ausente — e-mail de redefinição não enviado para ${payload.to}`,
    });
  }

  sendEmailChangeConfirmation(payload: { to: string; token: string }) {
    return this.dispatch({
      to: payload.to,
      subject: formatChangeEmailSubject(),
      html: buildChangeEmailHtml({
        confirmUrl: this.tokenUrl('/confirm-email-change', payload.token),
        logoUrl: this.logoUrl(),
        siteUrl: this.siteUrl(),
        recipientEmail: payload.to,
      }),
      missingKeyWarning: `RESEND_API_KEY ausente — e-mail de alteração não enviado para ${payload.to}`,
    });
  }

  private async dispatch(input: {
    to: string;
    subject: string;
    html: string;
    missingKeyWarning: string;
  }): Promise<MailSendResult> {
    const to = String(input.to || '').trim();
    if (!to) {
      return { skipped: true, reason: 'missing_recipient' };
    }

    if (!this.provider) {
      this.logger.warn(input.missingKeyWarning);
      return { skipped: true, reason: 'provider_unconfigured' };
    }

    await this.provider.send({
      to,
      subject: input.subject,
      html: input.html,
    });

    return { sent: true };
  }

  private tokenUrl(path: string, token: string) {
    return buildFrontendTokenUrl(
      this.config.get<string>('FRONTEND_URL'),
      path,
      token,
    );
  }

  private logoUrl() {
    return resolveEmailLogoUrl(
      this.config.get<string>('FRONTEND_URL'),
      this.config.get<string>('EMAIL_LOGO_URL'),
    );
  }

  private siteUrl() {
    return resolveEmailSiteUrl(this.config.get<string>('FRONTEND_URL'));
  }
}
