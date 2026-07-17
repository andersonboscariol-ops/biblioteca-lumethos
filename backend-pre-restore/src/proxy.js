const express = require('express');
const axios = require('axios');
const { URL } = require('url');
const router = express.Router();

const AGENCIA_BASE = 'https://members.agenciadoreino.com.br';

// Cache de sessão
let sessionCookies = null;
let sessionExpires = 0;

async function login() {
  const email = process.env.AGENCIA_EMAIL || 'anderson.boscariol@gmail.com';
  const password = process.env.AGENCIA_PASSWORD;

  if (!password) {
    throw new Error('AGENCIA_PASSWORD não configurada');
  }

  const loginPage = await axios.get(`${AGENCIA_BASE}/wp-login.php`, {
    headers: { 'User-Agent': 'Biblioteca-Lumethos/1.0' }
  });

  const nonceMatch = loginPage.data.match(/name="ppe-lf-login-nonce" value="([^"]+)"/);
  if (!nonceMatch) throw new Error('Não foi possível obter nonce de login');

  const formData = new URLSearchParams();
  formData.append('log', email);
  formData.append('pwd', password);
  formData.append('rememberme', 'forever');
  formData.append('wp-submit', 'Entrar');
  formData.append('redirect_to', `${AGENCIA_BASE}/wp-admin/`);
  formData.append('ppe-lf-login-nonce', nonceMatch[1]);

  const loginResp = await axios.post(`${AGENCIA_BASE}/wp-login.php`, formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Biblioteca-Lumethos/1.0',
      'Cookie': loginPage.headers['set-cookie']?.join('; ') || ''
    },
    maxRedirects: 0,
    validateStatus: s => s < 400
  });

  const cookies = loginResp.headers['set-cookie'];
  if (!cookies) throw new Error('Falha no login (sem cookie)');

  sessionCookies = cookies.join('; ');
  sessionExpires = Date.now() + 3600000; // 1h de sessão
  return sessionCookies;
}

async function getSession() {
  if (sessionCookies && Date.now() < sessionExpires) return sessionCookies;
  return await login();
}

// Proxy de PDF
router.get('/pdf', async (req, res) => {
  try {
    const pdfUrl = req.query.url;
    if (!pdfUrl) return res.status(400).json({ error: 'URL do PDF é obrigatória' });

    const targetUrl = decodeURIComponent(pdfUrl);
    const cookies = await getSession();

    const response = await axios.get(targetUrl, {
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Biblioteca-Lumethos/1.0',
        'Referer': AGENCIA_BASE
      },
      responseType: 'stream',
      validateStatus: s => s < 400
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'application/pdf');
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'inline');
    res.setHeader('Access-Control-Allow-Origin', '*');
    response.data.pipe(res);
  } catch (err) {
    console.error('Proxy PDF error:', err.message);
    res.status(502).json({ error: 'Erro ao buscar PDF', details: err.message });
  }
});

// Buscar conteúdo de um módulo/aula
router.get('/module-content', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL é obrigatória' });

    const cookies = await getSession();
    const response = await axios.get(url, {
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Biblioteca-Lumethos/1.0',
        'Referer': AGENCIA_BASE
      }
    });

    // Extrair links de PDF da página
    const html = response.data;
    const pdfLinks = [];
    const pdfRegex = /href="([^"]+\.pdf[^"]*)"/gi;
    let match;
    while ((match = pdfRegex.exec(html)) !== null) {
      const link = match[1].startsWith('http') ? match[1] : new URL(match[1], AGENCIA_BASE).href;
      pdfLinks.push(link);
    }

    // Extrair título
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/&#\d+;/g, '').trim() : 'Sem título';

    // Extrair conteúdo da aula
    const contentMatch = html.match(/id="tutor-single-entry-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
    const content = contentMatch ? contentMatch[1].substring(0, 5000) : '';

    res.json({
      title,
      url,
      pdfLinks: [...new Set(pdfLinks)],
      contentPreview: content.substring(0, 1000)
    });
  } catch (err) {
    console.error('Module content error:', err.message);
    res.status(502).json({ error: 'Erro ao buscar conteúdo do módulo', details: err.message });
  }
});

// Listar módulos (cursos) do site
router.get('/modules', async (req, res) => {
  try {
    const cookies = await getSession();
    const response = await axios.get(`${AGENCIA_BASE}/area-de-membros/`, {
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Biblioteca-Lumethos/1.0'
      }
    });

    const html = response.data;
    const moduleLinks = [];
    const modRegex = /href="(https:\/\/members\.agenciadoreino\.com\.br\/modulo\/[^"]+)"/gi;
    let match;
    while ((match = modRegex.exec(html)) !== null) {
      moduleLinks.push(match[1]);
    }

    const uniqueModules = [...new Set(moduleLinks)];
    res.json({ modules: uniqueModules, total: uniqueModules.length });
  } catch (err) {
    console.error('Modules list error:', err.message);
    res.status(502).json({ error: 'Erro ao listar módulos', details: err.message });
  }
});

module.exports = router;

// Raw HTML page fetch
router.get('/raw', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL é obrigatória' });

    const cookies = await getSession();
    const response = await axios.get(url, {
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Biblioteca-Lumethos/1.0',
        'Referer': 'https://members.agenciadoreino.com.br'
      }
    });

    // Extrair PDF links
    const html = response.data;
    
    // Tenta extrair links de aulas do Tutor LMS
    const lessonLinks = [];
    const lessonMatch = html.match(/<a[^>]*href="([^"]*\/modulo\/[^"]*\/conteudo\/[^"]*)"[^>]*>/gi);
    if (lessonMatch) {
      lessonMatch.forEach(a => {
        const hrefMatch = a.match(/href="([^"]+)"/);
        if (hrefMatch) lessonLinks.push(hrefMatch[1]);
      });
    }

    res.json({
      url,
      title: (html.match(/<title>([^<]+)<\/title>/) || [,''])[1],
      lessonLinks: [...new Set(lessonLinks)],
      htmlLength: html.length,
      htmlFull: html
    });
  } catch (err) {
    console.error('Raw fetch error:', err.message);
    res.status(502).json({ error: err.message });
  }
});
