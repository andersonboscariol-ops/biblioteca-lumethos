// email.js — Envio de credenciais + notificação de venda via Resend API
const { Resend } = require('resend');

const FROM_EMAIL = 'biblioteca@institutolumethos.online';
const FROM_NAME = 'Biblioteca Lumethos';
const REPLY_TO = 'instituto.lumethos@gmail.com';
const NOTIFY_TO = 'instituto.lumethos@gmail.com';
const LOGO_URL = 'https://biblioteca.institutolumethos.online/assets/logo-email-premium-300.png';

let resend = null;

function getClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[email] No RESEND_API_KEY in env — email disabled');
      return null;
    }
    resend = new Resend(apiKey);
    console.log('[email] Resend client initialized');
  }
  return resend;
}

// ======================================================================
// 1️⃣ EMAIL PARA O CLIENTE — Credenciais de acesso
// ======================================================================
async function sendCredentialsEmail(to, name, email, password, options = {}) {
  const client = getClient();
  if (!client) return false;

  const planName = options.planName || 'Biblioteca Lumethos — Assinatura Anual';
  const price = options.price || 'R$ 49,90';
  const loginUrl = 'https://biblioteca.institutolumethos.online/login';

  const html = buildClientHtml(name, email, password, loginUrl, price, planName);
  const text = buildClientText(name, email, password, loginUrl);

  try {
    const { data, error } = await client.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      reply_to: [REPLY_TO],
      to: [to],
      subject: '🎉 Biblioteca Lumethos — Sua assinatura foi ativada!',
      text,
      html,
    });

    if (error) {
      console.error(`[email] Resend error for ${to}:`, error);
      return false;
    }

    console.log(`[email] Credentials sent to ${to}:`, data?.id || 'OK');
    return true;
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err.message);
    return false;
  }
}

// ======================================================================
// 2️⃣ NOTIFICAÇÃO PRO LUMETHOS — Aviso de nova compra
// ======================================================================
async function sendPurchaseNotification(customerName, customerEmail, customerPhone, price, planName) {
  const client = getClient();
  if (!client) return false;

  const now = new Date();
  const dataHora = now.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const html = buildNotificationHtml(customerName, customerEmail, customerPhone, price, planName, dataHora);
  const text = buildNotificationText(customerName, customerEmail, customerPhone, price, planName, dataHora);

  try {
    const { data, error } = await client.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      reply_to: [REPLY_TO],
      to: [NOTIFY_TO],
      subject: `🛒 NOVA VENDA — ${planName} — ${customerName}`,
      text,
      html,
    });

    if (error) {
      console.error(`[email] Notification error:`, error);
      return false;
    }

    console.log(`[email] Purchase notification sent:`, data?.id || 'OK');
    return true;
  } catch (err) {
    console.error(`[email] Failed to send notification:`, err.message);
    return false;
  }
}

// ======================================================================
// TEMPLATES — CLIENTE (direto, nobre, sem excesso)
// ======================================================================
function buildClientHtml(name, email, password, loginUrl, price, planName) {
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const e = esc, ea = esc;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Biblioteca Lumethos</title>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    /* Force email links to gold, prevent blue auto-links */
    a { color: #E8C75A !important; text-decoration: none !important; }
    a:link, a:visited, a:hover, a:active { color: #E8C75A !important; text-decoration: none !important; }
    u + #body a { color: #E8C75A !important; text-decoration: none !important; }
    /* Outlook fix */
    .ExternalClass, .ReadMsgBody { width: 100%; }
    .ExternalClass p, .ExternalClass span { line-height: 100%; }
  </style>
</head>
<body id="body" style="margin:0; padding:0; background-color:#0A1E3D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A1E3D;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color:#0A1E3D;">

            <!-- Gold top border -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:5px; background:linear-gradient(90deg, #0A1E3D 0%, #D4AF37 20%, #E8C75A 50%, #D4AF37 80%, #0A1E3D 100%);"></td></tr>
            </table>

            <!-- Logo -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center; padding:32px 28px 12px;">
                  <img src="${ea(LOGO_URL)}" alt="Instituto Lumethos" width="280" style="max-width:100%; height:auto; border:0; display:block; margin:0 auto;">
                </td>
              </tr>
            </table>

            <!-- Greeting -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 28px 4px; text-align:center; font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#C8C4B8; line-height:1.6;">
                  <p style="margin:0;">Prezado(a) <strong style="color:#E8C75A;">${e(name)}</strong>, sua assinatura foi ativada. Abaixo estão seus dados de acesso.</p>
                </td>
              </tr>
            </table>

            <!-- Credentials card -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg, #1B2D4A, #122239); border:1px solid rgba(212,175,55,0.15); border-radius:12px;">
                    <tr><td colspan="2" style="height:2px; background:linear-gradient(90deg,transparent,#D4AF37,transparent);"></td></tr>
                    <tr>
                      <td style="padding:16px 20px 4px; text-align:center; font-family:'Helvetica Neue',Arial,sans-serif; font-size:9px; letter-spacing:3px; text-transform:uppercase; color:#D4AF37;">
                        Dados de Acesso
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 20px 4px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#8A8FA0; padding-bottom:4px;">Email</td>
                          </tr>
                          <tr>
                            <td style="padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(212,175,55,0.08); border-radius:8px; font-size:15px; color:#F5F0E0; white-space:nowrap;">${e(email.toLowerCase())}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 20px 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#8A8FA0; padding-bottom:4px;">Senha</td>
                          </tr>
                          <tr>
                            <td style="padding:10px 14px; background:rgba(232,199,90,0.06); border:2px solid rgba(232,199,90,0.5); border-radius:8px; font-family:'Courier New',monospace; font-size:32px; letter-spacing:5px; text-align:center; color:#F5F0E0; font-weight:700;">${e(password)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center; padding:4px 28px 20px;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${ea(loginUrl)}" style="height:46px;v-text-anchor:middle;width:300px;" arcsize="50%" strokecolor="#D4AF37" fillcolor="#D4AF37">
                    <w:anchorlock/>
                    <center style="color:#0A1E3D; font-family:'Helvetica Neue',Arial,sans-serif; font-size:13px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase;">Acessar Minha Biblioteca</center>
                  </v:roundrect>
                  <![endif]-->
                  <a href="${ea(loginUrl)}" target="_blank" style="display:inline-block; background:linear-gradient(135deg,#D4AF37,#C99A2E); color:#0A1E3D; text-decoration:none; font-family:'Helvetica Neue',Arial,sans-serif; font-weight:800; font-size:13px; letter-spacing:1.5px; text-transform:uppercase; padding:15px 44px; border-radius:50px;">
                    Acessar Minha Biblioteca
                  </a>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:20px 28px 24px; border-top:1px solid rgba(212,175,55,0.08); background:#122239; text-align:center;">
                  <p style="margin:0 0 8px; font-family:Georgia,'Times New Roman',serif; font-size:14px; color:#D4AF37;">Instituto Lumethos</p>
                  <p style="margin:0 0 10px; font-family:Georgia,serif; font-size:11px; font-style:italic; color:#8A8FA0;">A Maior Biblioteca Teológica Digital do Brasil</p>
                  <p style="margin:0; font-family:'Helvetica Neue',Arial,sans-serif; font-size:10px; color:#8A8FA0; line-height:1.5;">
                    Para suporte, responda a este email.<br>
                    &copy; 2026 Instituto Lumethos
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildClientText(name, email, password, loginUrl) {
  return `
INSTITUTO LUMETHOS — BIBLIOTECA TEOLÓGICA

Prezado(a) ${name}, sua assinatura foi ativada.

DADOS DE ACESSO
  Email: ${email}
  Senha: ${password}

Acesse: ${loginUrl}

Instituto Lumethos — A Maior Biblioteca Teológica Digital do Brasil
`;
}

// ======================================================================
// TEMPLATES — NOTIFICAÇÃO INTERNA
// ======================================================================
function buildNotificationHtml(customerName, customerEmail, customerPhone, price, planName, dataHora) {
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const e = esc;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Venda — Lumethos</title>
</head>
<body style="margin:0; padding:0; background-color:#F5EDDC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5EDDC;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color:#0A1E3D; border-radius:10px; overflow:hidden;">

            <!-- Ornament -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:4px; background:linear-gradient(90deg,#0A1E3D,#D4AF37,#E8C75A,#D4AF37,#0A1E3D);"></td></tr>
            </table>

            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center; padding:18px 20px 10px; border-bottom:1px solid rgba(212,175,55,0.12);">
                  <p style="margin:0; font-family:'Helvetica Neue',Arial,sans-serif; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#D4AF37;">✦ Nova Venda ✦</p>
                  <p style="margin:6px 0 2px; font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#E8C75A;">${e(planName)}</p>
                  <p style="margin:0; font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; color:#8A8FA0;">${e(dataHora)}</p>
                </td>
              </tr>
            </table>

            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:14px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(212,175,55,0.20); border-radius:8px; background:linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02)); margin-bottom:8px;">
                    <tr>
                      <td style="padding:10px 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#8A8FA0;">Valor</td>
                            <td style="text-align:right; font-size:17px; font-weight:700; color:#D4AF37;">${e(price)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:7px 14px; border-bottom:1px solid rgba(212,175,55,0.06);">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#8A8FA0;">Cliente</td>
                            <td style="text-align:right; font-size:13px; font-weight:600; color:#F0EDE4;">${e(customerName)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:7px 14px; border-bottom:1px solid rgba(212,175,55,0.06);">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#8A8FA0;">Email</td>
                            <td style="text-align:right; font-size:13px; font-weight:600; color:#F0EDE4;">${e(customerEmail)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:7px 14px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#8A8FA0;">WhatsApp</td>
                            <td style="text-align:right; font-size:13px; font-weight:600; color:#F0EDE4;">${customerPhone || '—'}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center; padding:14px 20px 18px; border-top:1px solid rgba(212,175,55,0.08); background:#122239;">
                  <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:12px; color:#D4AF37;">Instituto Lumethos</p>
                  <p style="margin:3px 0 0; font-family:'Helvetica Neue',Arial,sans-serif; font-size:10px; color:#8A8FA0;">Sistema Automático de Notificações</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildNotificationText(customerName, customerEmail, customerPhone, price, planName, dataHora) {
  return `NOVA VENDA — ${planName}
Data: ${dataHora}

Cliente: ${customerName}
Email: ${customerEmail}
WhatsApp: ${customerPhone || '—'}
Valor: ${price}

Instituto Lumethos`;
}

module.exports = { sendCredentialsEmail, sendPurchaseNotification };
