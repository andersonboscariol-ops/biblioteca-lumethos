// email.js — Envio de credenciais + notificação de venda via Resend API
const { Resend } = require('resend');

const FROM_EMAIL = 'biblioteca@institutolumethos.online';
const FROM_NAME = 'Biblioteca Lumethos';
const REPLY_TO = 'instituto.lumethos@gmail.com';
const NOTIFY_TO = 'instituto.lumethos@gmail.com';
const LOGO_URL = 'https://biblioteca.institutolumethos.online/logo-horizontal.png';

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
// 1️⃣ EMAIL PARA O CLIENTE — Credenciais de acesso (versão premium)
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
// TEMPLATES — CLIENTE
// ======================================================================
function buildClientHtml(name, email, password, loginUrl, price, planName) {
  const C = {
    navy: '#0D1B2A',
    navyLight: '#142D4C',
    blueText: '#0D1B2A',
    gold: '#C79A2E',
    bg: '#ffffff',
    cardBg: '#F8F7F4',
    border: '#E0DDD6',
    muted: '#8A8780',
    text: '#0D1B2A',
    textSoft: '#4A4850',
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Biblioteca Lumethos — Confirmação</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', 'Segoe UI', Arial, sans-serif;
      background: #f5f3ed;
      color: ${C.text};
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: ${C.bg};
    }

    /* ===== TOP BORDER ===== */
    .ornament-top {
      height: 5px;
      background: linear-gradient(90deg,
        #f5e7c8 0%, ${C.gold} 20%, #f5d78e 40%, ${C.gold} 60%, #f5d78e 80%, #f5e7c8 100%);
    }

    /* ===== HEADER ===== */
    .header {
      text-align: center;
      padding: 36px 28px 16px;
      background: ${C.bg};
    }
    .header img.logo {
      max-width: 300px;
      height: auto;
      margin-bottom: 10px;
    }
    .header .divider-line {
      width: 70px;
      height: 2px;
      margin: 12px auto;
      background: linear-gradient(90deg, transparent, ${C.gold}, transparent);
    }
    .header .subtitle {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 4px;
      color: ${C.muted};
    }

    /* ===== SEAL ===== */
    .seal {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${C.cardBg};
      border: 1px solid rgba(199, 154, 46, 0.25);
      border-radius: 50px;
      padding: 5px 16px 5px 12px;
      margin: 10px 0 4px;
      font-size: 10px;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: ${C.gold};
    }
    .seal .dot-green {
      width: 8px; height: 8px;
      background: #22c55e;
      border-radius: 50%;
      display: inline-block;
    }

    /* ===== GREETING ===== */
    .greeting {
      text-align: center;
      padding: 20px 28px 2px;
      font-size: 15px;
      color: ${C.textSoft};
    }
    .greeting strong {
      color: ${C.navy};
      font-weight: 700;
    }

    /* ===== CREDENTIALS CARD ===== */
    .credentials-card {
      margin: 20px 28px;
      background: ${C.cardBg};
      border: 1px solid ${C.border};
      border-radius: 16px;
      padding: 28px 24px;
      position: relative;
    }
    .credentials-card::before {
      content: '';
      position: absolute;
      top: -1px; left: 40px; right: 40px;
      height: 2px;
      background: linear-gradient(90deg, transparent, ${C.gold}, transparent);
    }
    .cred-row {
      margin-bottom: 20px;
    }
    .cred-row:last-child { margin-bottom: 0; }
    .cred-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 2.2px;
      color: ${C.muted};
      margin-bottom: 6px;
      font-weight: 600;
    }
    .cred-box {
      display: block;
      padding: 12px 16px;
      background: ${C.bg};
      border: 1px solid ${C.border};
      border-radius: 10px;
      font-size: 16px;
      color: ${C.text};
      word-break: break-all;
    }
    .cred-box.email {
      color: ${C.navy};
      font-weight: 500;
    }
    .cred-box.password {
      font-family: 'SF Mono', 'Courier New', 'Fira Code', monospace;
      font-size: 28px;
      letter-spacing: 4px;
      text-align: center;
      color: ${C.navy};
      font-weight: 700;
      background: #FCFAF5;
      border: 1.5px solid ${C.navy};
      user-select: all;
      -webkit-user-select: all;
      -moz-user-select: all;
    }
    .cred-hint {
      font-size: 11px;
      color: ${C.muted};
      margin-top: 6px;
      text-align: center;
    }

    /* ===== CTA ===== */
    .cta-wrapper {
      text-align: center;
      margin: 28px 28px 24px;
    }
    .cta-btn {
      display: inline-block;
      background: ${C.navy};
      color: #ffffff !important;
      text-decoration: none !important;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      padding: 16px 48px;
      border-radius: 50px;
    }

    /* ===== INFO GRID ===== */
    .info-grid {
      margin: 0 28px 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .info-item {
      background: ${C.cardBg};
      border: 1px solid ${C.border};
      border-radius: 12px;
      padding: 16px 12px;
      text-align: center;
    }
    .info-item .num {
      font-size: 20px;
      font-weight: 700;
      color: ${C.navy};
    }
    .info-item .desc {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: ${C.muted};
      margin-top: 3px;
    }

    /* ===== BENEFITS ===== */
    .benefits-section {
      margin: 0 28px 20px;
      padding: 24px 28px;
      background: ${C.cardBg};
      border: 1px solid ${C.border};
      border-radius: 14px;
    }
    .benefits-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: ${C.navy};
      text-align: center;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .benefits-section ul {
      list-style: none;
      padding: 0;
    }
    .benefits-section ul li {
      font-size: 13px;
      color: ${C.textSoft};
      padding: 8px 0;
      border-bottom: 1px solid ${C.border};
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .benefits-section ul li:last-child { border-bottom: none; }
    .benefits-section ul li::before {
      content: '✦';
      color: ${C.gold};
      font-size: 11px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* ===== FOOTER ===== */
    .footer {
      text-align: center;
      padding: 28px 28px 32px;
      border-top: 1px solid ${C.border};
      background: ${C.cardBg};
    }
    .footer .brand {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 15px;
      color: ${C.navy};
      font-weight: 700;
    }
    .footer .tagline {
      font-size: 10px;
      color: ${C.muted};
      margin: 3px 0 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer .links a {
      color: ${C.navy};
      text-decoration: none;
      font-size: 12px;
      margin: 0 6px;
    }
    .footer .links .sep {
      color: ${C.border};
      margin: 0 2px;
    }
    .footer .disclaimer {
      font-size: 10px;
      color: ${C.muted};
      margin-top: 14px;
      line-height: 1.5;
    }
    .footer .copyright {
      font-size: 10px;
      color: ${C.muted};
      margin-top: 12px;
    }

    @media (max-width: 480px) {
      .header { padding: 28px 20px 12px; }
      .header img.logo { max-width: 240px; }
      .credentials-card { margin: 16px 16px; padding: 20px 16px; }
      .cred-box.password { font-size: 22px; letter-spacing: 2px; }
      .info-grid { grid-template-columns: 1fr 1fr; margin: 0 16px 16px; gap: 8px; }
      .benefits-section { margin: 0 16px 16px; padding: 20px 18px; }
      .cta-wrapper { margin: 20px 16px; }
      .cta-btn { font-size: 12px; padding: 14px 32px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="ornament-top"></div>

    <!-- HEADER -->
    <div class="header">
      <img src="${escAttr(LOGO_URL)}" alt="Instituto Lumethos" class="logo" width="300">
      <div class="divider-line"></div>
      <div class="subtitle">Confirmação de Assinatura</div>
      <div class="seal">
        <span class="dot-green"></span>
        Assinatura Ativa
      </div>
    </div>

    <!-- GREETING -->
    <div class="greeting">
      <p>Prezado(a) <strong>${esc(name)}</strong>, é com grande satisfação que recebemos você como assinante!</p>
    </div>

    <!-- CREDENTIALS -->
    <div class="credentials-card">
      <div class="cred-row">
        <div class="cred-label">📧 Seu Email de Acesso</div>
        <div class="cred-box email">${esc(email.toLowerCase())}</div>
      </div>
      <div class="cred-row">
        <div class="cred-label">🔑 Sua Senha</div>
        <div class="cred-box password">${esc(password)}</div>
        <div class="cred-hint">Clique sobre a senha para selecionar e copie com Ctrl+C ou ⌘C</div>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-wrapper">
      <a href="${escAttr(loginUrl)}" class="cta-btn">✦ Acessar Minha Biblioteca ✦</a>
    </div>

    <!-- INFO -->
    <div class="info-grid">
      <div class="info-item">
        <div class="num">${price}</div>
        <div class="desc">Investimento</div>
      </div>
      <div class="info-item">
        <div class="num">📖 1000+</div>
        <div class="desc">Obras Teológicas</div>
      </div>
      <div class="info-item">
        <div class="num">📚 36</div>
        <div class="desc">Categorias</div>
      </div>
      <div class="info-item">
        <div class="num">📱</div>
        <div class="desc">Leitura Mobile</div>
      </div>
    </div>

    <!-- BENEFITS -->
    <div class="benefits-section">
      <h3>✦ Sua Biblioteca Inclui ✦</h3>
      <ul>
        <li>Acesso completo a mais de 1.000 obras de teologia, comentários bíblicos e literatura cristã</li>
        <li>Acervo organizado em 36 categorias para estudo sistemático da Palavra</li>
        <li>Leitura online e download de PDFs para consulta offline onde estiver</li>
        <li>Novos títulos adicionados mensalmente ao acervo</li>
        <li>Acesso ilimitado durante todo o período da sua assinatura</li>
      </ul>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="brand">Instituto Lumethos</div>
      <div class="tagline">A Maior Biblioteca Teológica Digital do Brasil</div>
      <div class="links">
        <a href="https://institutolumethos.online">institutolumethos.online</a>
        <span class="sep">|</span>
        <a href="https://biblioteca.institutolumethos.online">Biblioteca</a>
      </div>
      <div class="disclaimer">
        Este é um email automático. Se você não realizou esta compra, ignore esta mensagem.<br>
        Para suporte, responda a este email ou entre em contato pelo nosso WhatsApp.
      </div>
      <div class="copyright">
        &copy; ${new Date().getFullYear()} Instituto Lumethos — Todos os direitos reservados
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildClientText(name, email, password, loginUrl) {
  return `═══════════════════════════════════════════
INSTITUTO LUMETHOS — BIBLIOTECA TEOLÓGICA
═══════════════════════════════════════════

Prezado(a) ${name},

Sua assinatura da Biblioteca Lumethos foi ativada com sucesso!

─── DADOS DE ACESSO ───

Email: ${email}
Senha: ${password}

Acesse: ${loginUrl}

✦ 1000+ obras teológicas
✦ 36 categorias
✦ Leitura online e download

Para qualquer dúvida, responda a este email.

─── Instituto Lumethos ───
A Maior Biblioteca Teológica Digital do Brasil`;
}

// ======================================================================
// TEMPLATES — NOTIFICAÇÃO INTERNA
// ======================================================================
function buildNotificationHtml(customerName, customerEmail, customerPhone, price, planName, dataHora) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #0b0b12;
      color: #e0e0e0;
      line-height: 1.6;
    }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
    .header { text-align: center; padding: 24px 0; border-bottom: 2px solid #d4af37; }
    .header h1 { color: #d4af37; font-size: 22px; }
    .header .time { color: #888; font-size: 13px; margin-top: 4px; }
    .badge {
      display: inline-block;
      background: #22c55e;
      color: #000;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 8px;
    }
    .content { padding: 24px 0; }
    .field {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .field .label { color: #888; font-size: 13px; }
    .field .value { color: #f0e8d0; font-weight: 600; font-size: 14px; }
    .field:last-child { border-bottom: none; }
    .price-row {
      background: rgba(212,175,55,0.08);
      border: 1px solid rgba(212,175,55,0.2);
      border-radius: 12px;
      margin: 16px 0;
    }
    .price-row .value { color: #d4af37; font-size: 18px; }
    .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); color: #666; font-size: 12px; }
    @media (max-width: 480px) {
      .field { flex-direction: column; gap: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">🛒 Nova Venda</div>
      <h1>${esc(planName)}</h1>
      <div class="time">${dataHora}</div>
    </div>
    <div class="content">
      <div class="field price-row">
        <span class="label">Valor</span>
        <span class="value">${price}</span>
      </div>
      <div class="field">
        <span class="label">Cliente</span>
        <span class="value">${esc(customerName)}</span>
      </div>
      <div class="field">
        <span class="label">Email</span>
        <span class="value">${esc(customerEmail)}</span>
      </div>
      <div class="field">
        <span class="label">WhatsApp</span>
        <span class="value">${customerPhone ? esc(customerPhone) : '—'}</span>
      </div>
    </div>
    <div class="footer">
      <p>Biblioteca Lumethos — Sistema Automático de Notificações</p>
      <p style="margin-top:4px;">institutolumethos.online</p>
    </div>
  </div>
</body>
</html>`;
}

function buildNotificationText(customerName, customerEmail, customerPhone, price, planName, dataHora) {
  return `═══════════════════════════════════
🛒 NOVA VENDA — ${planName}
═══════════════════════════════════
Data/Hora: ${dataHora}

Cliente: ${customerName}
Email: ${customerEmail}
WhatsApp: ${customerPhone || '—'}
Valor: ${price}
───────────────────────────────────
Biblioteca Lumethos — Notificação Automática`;
}

// ======================================================================
// HELPERS
// ======================================================================
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { sendCredentialsEmail, sendPurchaseNotification };
