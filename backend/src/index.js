require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require("path");
const fs = require("fs");
const https = require('https');
const catalogRouter = require('./catalog');
const proxyRouter = require('./proxy');
const thumbnailRouter = require('./thumbnail-proxy');
const statsRouter = require('./stats');

const app = express();
const PORT = process.env.PORT || 3020;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://drive.google.com', 'https://lh3.googleusercontent.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      frameSrc: ["'self'", "https://drive.google.com"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
    }
  }
}));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(compression()); // gzip/brotli
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Forçar sem cache pra HTML (antes do express.static)
app.use(function(req, res, next) {
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Servir o frontend buildado
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Cache de mapeamento cover -> GID
const coverGidCache = new Map();

// Extrair GID do filename (remove extensao e prefixo de categoria)
function extractGid(filename) {
  // Usar path.parse para remover extensao corretamente
  const name = path.parse(filename).name;
  const gid = name.replace(/^[a-z-]+_/, '');
  return gid;
}

// Servir capas com fallback para Google Drive
app.use('/covers', (req, res, next) => {
  const filename = path.basename(req.path);
  const filePath = path.join(__dirname, '../public/covers', filename);

  if (fs.existsSync(filePath)) {
    // Verificar se o arquivo é uma imagem válida (cabeçalho JPEG: \xFF\xD8\xFF)
    try {
      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(3);
      fs.readSync(fd, buf, 0, 3, 0);
      fs.closeSync(fd);
      const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E;
      const isWebpHeader = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46; // RIFF
      if (!isJpeg && !isPng && !isWebpHeader) {
        // Arquivo corrompido (ex: HTML salvo como .jpg) - tratar como não encontrado
        console.log('[Cover skip corrupted]', filename);
        // Não servir este arquivo, vai pro fallback
      } else {
        return express.static(path.join(__dirname, '../public/covers'), {
          maxAge: '7d',
          immutable: true,
          setHeaders: (res, fp) => {
            if (fp.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
          }
        })(req, res, next);
      }
    } catch (e) {
      console.error('[Cover header check error]', e.message);
      // Em caso de erro, tenta servir o arquivo mesmo assim
      return express.static(path.join(__dirname, '../public/covers'), {
        maxAge: '7d',
        immutable: true
      })(req, res, next);
    }
  }

  // Tentar buscar thumbnail do Google Drive
  const fileId = path.parse(filename).name;
  // Ignorar se for capa-generica (já tentou acima)
  if (fileId && fileId !== 'capa-generica' && !fileId.includes('_')) {
    const gdriveUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    console.log('[Cover proxy]', fileId, '→ Google Drive');
    try {
      const imgPath = filePath;
      const file = fs.createWriteStream(imgPath + '.download');
      https.get(gdriveUrl, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (gRes) => {
        // Verificar se é imagem válida pelo content-type
        const ct = gRes.headers['content-type'] || '';
        if (ct.startsWith('image/') && gRes.statusCode === 200) {
          gRes.pipe(file);
          file.on('finish', () => {
            file.close(() => {
              fs.renameSync(imgPath + '.download', imgPath);
              console.log('[Cover cached]', fileId);
              res.sendFile(imgPath);
            });
          });
        } else {
          // Não é imagem, limpar e fallback
          file.close(() => {
            try { fs.unlinkSync(imgPath + '.download'); } catch(e) {}
            fallback();
          });
        }
      }).on('error', (e) => {
        console.log('[Cover proxy error]', fileId, e.message);
        file.close(() => {
          try { fs.unlinkSync(imgPath + '.download'); } catch(e) {}
          fallback();
        });
      });
      return;
    } catch (e) {
      console.log('[Cover proxy exception]', fileId, e.message);
    }
  }

  function fallback() {
    const fallbackPath = path.join(__dirname, '../public/covers/capa-generica.jpg');
    if (fs.existsSync(fallbackPath)) {
      return res.sendFile(fallbackPath);
    }
    res.status(404).json({ error: 'Cover not found' });
  }
  fallback();
});

// API Routes
// Auth, Subscription & Admin routes
const authRouter = require('./auth');
const subscriptionRouter = require('./subscription');
const adminRouter = require('./admin');
const settingsRouter = require('./settings');
const { extractUser } = require('./middleware');
const db = require('./db');

// Apply user extraction to ALL API routes — must be BEFORE any API routers!
app.use('/api', extractUser);

app.use('/api/catalog', catalogRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/thumbnail', thumbnailRouter);
app.use('/api/stats', statsRouter);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/sub', subscriptionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/settings', settingsRouter);

// Ler livro — redireciona para Google Drive View (somente assinantes)
app.get('/api/read/:fileId', (req, res) => {
  const { fileId } = req.params;
  if (!fileId) return res.status(400).json({ error: 'fileId é obrigatório' });
  // Check subscription
  if (!req.user || !req.user.id || !db.isSubscriptionActive(req.user.id)) {
    return res.status(403).json({ error: 'Assinatura necessária para acessar este conteúdo', requires_subscription: true });
  }
  const driveUrl = `https://drive.google.com/file/d/${fileId}/view`;
  res.redirect(302, driveUrl);
});

// Mobile: obtém UUID do virus scan page (rápido, ~2KB) e redireciona pro download direto
// Cliente baixa o PDF direto do Google CDN (não passa pelo servidor)
app.get('/api/mobile/:fileId', async (req, res) => {
  const { fileId } = req.params;
  if (!fileId) return res.status(400).json({ error: 'fileId é obrigatório' });

  try {
    const resp = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(15000)
    });

    const html = await resp.text();
    const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);

    if (uuidMatch && uuidMatch[1]) {
      const uuid = uuidMatch[1];
      const dlUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=${uuid}`;
      return res.redirect(302, dlUrl);
    }
  } catch (err) {
    console.error('[mobile] erro ao extrair UUID:', err.message);
  }

  // Fallback: simples redirect pro Google Drive view
  res.redirect(302, `https://drive.google.com/file/d/${fileId}/view`);
});

// Download livro — redireciona para Google Drive Download (somente assinantes)
app.get('/api/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  if (!fileId) return res.status(400).json({ error: 'fileId é obrigatório' });
  // Check subscription
  if (!req.user || !req.user.id || !db.isSubscriptionActive(req.user.id)) {
    return res.status(403).json({ error: 'Assinatura necessária para baixar este conteúdo', requires_subscription: true });
  }
  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  res.redirect(302, driveUrl);
});

// === Login Page — standalone, estilo Área do Aluno ===
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/login.html'));
});

// === Login via Form POST (fallback for mobile/no-JS) ===
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.send(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Erro</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5}</style></head><body><p style="color:red">Preencha todos os campos.</p><a href="/login">Voltar</a></body></html>'
    );
  }
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const user = db.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.send(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Erro</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5}</style></head><body><p style="color:red">Email ou senha inv\u00e1lidos.</p><a href="/login">Tentar novamente</a></body></html>'
      );
    }
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const sub = db.getSubscription(user.id);
    const isActive = sub && sub.status === 'active' && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
    const redirectUrl = isActive ? '/app' : '/login?checkout=required';
    const safeToken = token.replace(/'/g, "\\'");
    return res.send(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Entrando...</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5}</style></head><body><p>Autenticando...</p>' +
      '<script>try { localStorage.setItem(\'biblioteca_token\', \'' + safeToken + '\'); } catch(e) {}' +
      'window.location.href = \'' + redirectUrl + '\';' +
      '<\/scr' + 'ipt></body></html>'
    );
  } catch (err) {
    console.error('POST /login error:', err);
    return res.status(500).send('Erro interno do servidor');
  }
});

// === Admin Panel ===
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/admin.html'));
});

// === Authenticated App (SPA) ===
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/app.html'));
});

// SPA fallback - serve app.html by default (authenticated SPA)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/assets/') && !req.path.match(/\.\w+$/)) {
    return res.sendFile(path.join(__dirname, '../../frontend/dist/app.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`📚 Biblioteca Lumethos API rodando na porta ${PORT}`);
});
