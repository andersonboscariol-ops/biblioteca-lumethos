// email.js — Envio de credenciais + notificação de venda via Resend API
const { Resend } = require('resend');

const FROM_EMAIL = 'biblioteca@institutolumethos.online';
const FROM_NAME = 'Biblioteca Lumethos';
const REPLY_TO = 'instituto.lumethos@gmail.com';
const NOTIFY_TO = 'instituto.lumethos@gmail.com';
const LOGO_URL = 'https://biblioteca.institutolumethos.online/assets/logo-email-nova.webp';

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
// 1 — EMAIL PARA O CLIENTE — Credenciais de acesso
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
      subject: 'Biblioteca Lumethos — Sua assinatura foi ativada',
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
// 2 — NOTIFICACAO PRO LUMETHOS — Aviso de nova compra
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
      subject: `Nova venda — ${planName} — ${customerName}`,
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
// TEMPLATES — CLIENTE (limpo, sem triggers de spam)
// ======================================================================
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildClientHtml(name, emailAddr, password, loginUrl, price, planName) {
  const e = esc;

  // Tema claro — estilo transacional (banco, nota fiscal)
  // Nada escuro, nada dourado pesado, texto preto, fundo branco
  const white = '#FFFFFF';
  const offWhite = '#F4F4F4';
  const border = '#DDDDDD';
  const text = '#333333';
  const textMuted = '#666666';
  const accent = '#B8860B';  // dourado escuro e discreto
  const accentLight = '#FDF6E3';

  return '<!DOCTYPE html>\n' +
'<html lang="pt-BR">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <title>Biblioteca Lumethos</title>\n' +
'</head>\n' +
'<body style="margin:0;padding:0;background-color:' + offWhite + ';font-family:Arial,\'Helvetica Neue\',Helvetica,sans-serif;">\n' +
'  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:' + offWhite + ';">\n' +
'    <tr><td align="center" style="padding:20px 0;">\n' +
'      <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">\n' +
'        <tr><td style="background-color:' + white + ';border-radius:6px;overflow:hidden;">\n' +
'\n' +
'          <!-- header com logo -->\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr>\n' +
'              <td style="text-align:center;padding:24px 20px 8px;">\n' +
'                <img src="' + e(LOGO_URL) + '" alt="Instituto Lumethos" width="200" style="max-width:100%;height:auto;border:0;display:block;margin:0 auto;">\n' +
'              </td>\n' +
'            </tr>\n' +
'          </table>\n' +
'\n' +
'          <!-- linha sutil -->\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr><td style="height:1px;background-color:' + border + ';"></td></tr>\n' +
'          </table>\n' +
'\n' +
'          <!-- saudacao -->\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr>\n' +
'              <td style="padding:16px 24px 4px;font-size:15px;color:' + text + ';line-height:1.5;">\n' +
'                <p style="margin:0;">Prezado(a) <strong>' + e(name) + '</strong>,</p>\n' +
'                <p style="margin:8px 0 0;">Sua assinatura da Biblioteca Lumethos foi ativada. Abaixo estao seus dados de acesso.</p>\n' +
'              </td>\n' +
'            </tr>\n' +
'          </table>\n' +
'\n' +
'          <!-- card credenciais -->\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr><td style="padding:8px 24px;">\n' +
'              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:' + accentLight + ';border:1px solid ' + border + ';border-radius:6px;">\n' +
'                <tr><td style="padding:12px 16px;">\n' +
'                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'                    <tr>\n' +
'                      <td style="font-size:11px;color:' + textMuted + ';padding-bottom:2px;">Email de acesso</td>\n' +
'                    </tr>\n' +
'                    <tr>\n' +
'                      <td style="font-size:15px;color:' + text + ';font-weight:600;padding-bottom:10px;">' + e(emailAddr.toLowerCase()) + '</td>\n' +
'                    </tr>\n' +
'                    <tr>\n' +
'                      <td style="height:1px;background-color:' + border + ';"></td>\n' +
'                    </tr>\n' +
'                    <tr>\n' +
'                      <td style="font-size:11px;color:' + textMuted + ';padding:8px 0 2px;">Senha</td>\n' +
'                    </tr>\n' +
'                    <tr>\n' +
'                      <td style="font-size:24px;letter-spacing:3px;color:' + text + ';font-weight:700;font-family:\'Courier New\',monospace;">' + e(password) + '</td>\n' +
'                    </tr>\n' +
'                  </table>\n' +
'                </td></tr>\n' +
'              </table>\n' +
'            </td></tr>\n' +
'          </table>\n' +
'\n' +
'          <!-- instrucao -->\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr><td style="padding:4px 24px 12px;font-size:13px;color:' + textMuted + ';line-height:1.5;">\n' +
'              Utilize os dados acima para acessar a plataforma. Recomendamos alterar sua senha no primeiro acesso.\n' +
'            </td></tr>\n' +
'          </table>\n' +
'\n' +
'          <!-- CTA -->\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr><td style="text-align:center;padding:4px 24px 20px;">\n' +
'              <a href="' + e(loginUrl) + '" target="_blank" style="display:inline-block;background-color:#1A3C6D;color:' + white + ';text-decoration:none;font-weight:700;font-size:13px;padding:13px 32px;border-radius:6px;">Acessar Biblioteca</a>\n' +
'            </td></tr>\n' +
'          </table>\n' +
'\n' +
'        </td></tr>\n' +
'\n' +
'        <!-- footer externo -->\n' +
'        <tr><td style="padding:16px 0 0;text-align:center;font-size:11px;color:' + textMuted + ';line-height:1.5;">\n' +
'          <p style="margin:0;font-weight:600;">Instituto Lumethos</p>\n' +
'          <p style="margin:4px 0 0;">O maior centro de formacao ministerial do Brasil</p>\n' +
'          <p style="margin:4px 0 0;">Se tiver duvidas, responda a este email.</p>\n' +
'        </td></tr>\n' +
'      </table>\n' +
'    </td></tr>\n' +
'  </table>\n' +
'</body>\n' +
'</html>';
}

function buildClientText(name, emailAddr, password, loginUrl) {
  return 'INSTITUTO LUMETHOS — BIBLIOTECA TEOLOGICA\n' +
'\n' +
'Prezado(a) ' + name + ', sua assinatura foi ativada.\n' +
'\n' +
'DADOS DE ACESSO\n' +
'  Email: ' + emailAddr + '\n' +
'  Senha: ' + password + '\n' +
'\n' +
'Acesse: ' + loginUrl + '\n' +
'\n' +
'Instituto Lumethos';
}

// ======================================================================
// TEMPLATES — NOTIFICACAO INTERNA
// ======================================================================
function buildNotificationHtml(customerName, customerEmail, customerPhone, price, planName, dataHora) {
  const e = esc;

  const bgDark = '#0A1E3D';
  const bgCard = '#122239';
  const gold    = '#D4AF37';

  return '<!DOCTYPE html>\n' +
'<html lang="pt-BR">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>Nova Venda — Lumethos</title>\n' +
'</head>\n' +
'<body style="margin:0;padding:0;background-color:#F5EDDC;">\n' +
'  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5EDDC;">\n' +
'    <tr><td align="center">\n' +
'      <table role="presentation" width="100%" style="max-width:500px;" cellpadding="0" cellspacing="0">\n' +
'        <tr><td style="background-color:' + bgDark + ';border-radius:8px;overflow:hidden;">\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr><td style="height:3px;background-color:' + gold + ';"></td></tr>\n' +
'          </table>\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr><td style="text-align:center;padding:14px 16px 8px;border-bottom:1px solid #2A3F5E;">\n' +
'              <p style="margin:0;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + gold + ';">Nova Venda</p>\n' +
'              <p style="margin:4px 0 2px;font-family:Georgia,\'Times New Roman\',serif;font-size:15px;color:' + gold + ';">' + e(planName) + '</p>\n' +
'              <p style="margin:0;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:#8A8FA0;">' + e(dataHora) + '</p>\n' +
'            </td></tr>\n' +
'          </table>\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr><td style="padding:12px 16px;">\n' +
'              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2A3F5E;border-radius:6px;background-color:' + bgCard + ';margin-bottom:6px;">\n' +
'                <tr><td style="padding:8px 12px;">\n' +
'                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'                    <tr><td style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8A8FA0;">Valor</td><td style="text-align:right;font-size:16px;font-weight:700;color:' + gold + ';">' + e(price) + '</td></tr>\n' +
'                  </table>\n' +
'                </td></tr>\n' +
'              </table>\n' +
'              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'                <tr><td style="padding:6px 12px 4px;border-bottom:1px solid #2A3F5E;">\n' +
'                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'                    <tr><td style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8A8FA0;">Cliente</td><td style="text-align:right;font-size:13px;font-weight:600;color:#F0EDE4;">' + e(customerName) + '</td></tr>\n' +
'                  </table>\n' +
'                </td></tr>\n' +
'                <tr><td style="padding:6px 12px 4px;border-bottom:1px solid #2A3F5E;">\n' +
'                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'                    <tr><td style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8A8FA0;">Email</td><td style="text-align:right;font-size:13px;font-weight:600;color:#F0EDE4;">' + e(customerEmail) + '</td></tr>\n' +
'                  </table>\n' +
'                </td></tr>\n' +
'                <tr><td style="padding:6px 12px 4px;">\n' +
'                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'                    <tr><td style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8A8FA0;">WhatsApp</td><td style="text-align:right;font-size:13px;font-weight:600;color:#F0EDE4;">' + (customerPhone || '&mdash;') + '</td></tr>\n' +
'                  </table>\n' +
'                </td></tr>\n' +
'              </table>\n' +
'            </td></tr>\n' +
'          </table>\n' +
'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n' +
'            <tr><td style="text-align:center;padding:10px 16px 14px;border-top:1px solid #2A3F5E;">\n' +
'              <p style="margin:0;font-family:Georgia,\'Times New Roman\',serif;font-size:11px;color:' + gold + ';">Instituto Lumethos</p>\n' +
'              <p style="margin:2px 0 0;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;color:#8A8FA0;">Sistema Automatico de Notificacoes</p>\n' +
'            </td></tr>\n' +
'          </table>\n' +
'        </td></tr>\n' +
'      </table>\n' +
'    </td></tr>\n' +
'  </table>\n' +
'</body>\n' +
'</html>';
}

function buildNotificationText(customerName, customerEmail, customerPhone, price, planName, dataHora) {
  return 'NOVA VENDA — ' + planName + '\n' +
'Data: ' + dataHora + '\n' +
'\n' +
'Cliente: ' + customerName + '\n' +
'Email: ' + customerEmail + '\n' +
'WhatsApp: ' + (customerPhone || '—') + '\n' +
'Valor: ' + price + '\n' +
'\n' +
'Instituto Lumethos';
}

module.exports = { sendCredentialsEmail, sendPurchaseNotification };
