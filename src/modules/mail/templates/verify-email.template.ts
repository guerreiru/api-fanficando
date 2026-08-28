import { escapeHtml } from '../html';

export function formatVerifyEmailSubject(): string {
  return 'Confirme seu e-mail — Fanficando';
}

export function buildVerifyEmailHtml({
  verifyUrl,
  logoUrl,
  siteUrl,
  recipientEmail,
}: {
  verifyUrl: string;
  logoUrl: string;
  siteUrl: string;
  recipientEmail?: string;
}): string {
  const safeUrl = escapeHtml(verifyUrl);
  const safeLogoUrl = escapeHtml(logoUrl);
  const safeSiteUrl = escapeHtml(siteUrl);
  const safeEmail = escapeHtml(recipientEmail || '');
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Confirme seu e-mail — Fanficando</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Sua conta no Fanficando está quase pronta. Confirme seu e-mail para começar a ler e publicar histórias.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(47,46,65,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2F2E41 0%,#3d3c52 100%);padding:28px 24px;text-align:center;">
              <a href="${safeSiteUrl}" style="text-decoration:none;display:inline-block;">
                <img
                  src="${safeLogoUrl}"
                  alt="Fanficando"
                  width="160"
                  height="auto"
                  style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;height:auto;max-width:160px;width:160px;"
                />
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 12px 32px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#75714C;">
                Bem-vindo(a)
              </p>
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;color:#2F2E41;font-weight:700;">
                Confirme seu e-mail
              </h1>
              <p style="margin:0;font-size:16px;line-height:1.7;color:#4b5563;">
                Sua conta foi criada com sucesso. Para ativar o acesso completo ao Fanficando,
                confirme seu endereço de e-mail${safeEmail ? ` <strong style="color:#2F2E41;">${safeEmail}</strong>` : ''}.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 8px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #ececec;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#2F2E41;">
                      O que fazer agora
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
                      1. Clique no botão abaixo<br />
                      2. Confirme seu e-mail na página segura<br />
                      3. Volte ao Fanficando e comece a explorar
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 8px 32px;">
              <a
                href="${safeUrl}"
                style="display:inline-block;background:#2F2E41;color:#ffffff;text-decoration:none;padding:15px 32px;border-radius:10px;font-size:16px;font-weight:700;line-height:1;box-shadow:0 8px 20px rgba(47,46,65,0.18);"
              >
                Confirmar e-mail
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 24px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;text-align:center;">
                Este link expira em <strong style="color:#6b7280;">24 horas</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px 32px;">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;">
                <a href="${safeUrl}" style="color:#75714C;text-decoration:underline;">${safeUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ececec;">
                <tr>
                  <td style="padding-top:20px;">
                    <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#6b7280;">
                      Não encontrou o e-mail? Verifique a caixa de spam ou lixo eletrônico.
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                      Se você não criou uma conta no Fanficando, pode ignorar esta mensagem com segurança.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:18px 24px;text-align:center;border-top:1px solid #ececec;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
                <a href="${safeSiteUrl}" style="color:#75714C;text-decoration:none;font-weight:700;">Fanficando</a>
                — histórias, fanfics e comunidade
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                © ${year} Fanficando. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
