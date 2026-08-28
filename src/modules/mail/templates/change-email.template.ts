import { escapeHtml } from '../html';

export function formatChangeEmailSubject(): string {
  return 'Confirme seu novo e-mail — Fanficando';
}

export function buildChangeEmailHtml({
  confirmUrl,
  logoUrl,
  siteUrl,
  recipientEmail,
}: {
  confirmUrl: string;
  logoUrl: string;
  siteUrl: string;
  recipientEmail?: string;
}): string {
  const safeUrl = escapeHtml(confirmUrl);
  const safeLogoUrl = escapeHtml(logoUrl);
  const safeSiteUrl = escapeHtml(siteUrl);
  const safeEmail = escapeHtml(recipientEmail || '');
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmar novo e-mail — Fanficando</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#2F2E41;padding:28px 24px;text-align:center;">
              <a href="${safeSiteUrl}"><img src="${safeLogoUrl}" alt="Fanficando" width="160" style="display:block;margin:0 auto;border:0;" /></a>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 12px 32px;">
              <h1 style="margin:0 0 16px;font-size:28px;color:#2F2E41;">Confirme seu novo e-mail</h1>
              <p style="margin:0;font-size:16px;line-height:1.7;color:#4b5563;">
                Você solicitou alterar o e-mail da sua conta para
                ${safeEmail ? ` <strong>${safeEmail}</strong>` : ' um novo endereço'}.
                Confirme para concluir a alteração.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px 32px;">
              <a href="${safeUrl}" style="display:inline-block;background:#2F2E41;color:#ffffff;text-decoration:none;padding:15px 32px;border-radius:10px;font-size:16px;font-weight:700;">Confirmar novo e-mail</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;text-align:center;">Este link expira em <strong>24 horas</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">Se você não solicitou esta alteração, ignore este e-mail.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:18px 24px;text-align:center;border-top:1px solid #ececec;">
              <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${year} Fanficando</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
