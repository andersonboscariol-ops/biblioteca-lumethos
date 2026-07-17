// admin.js — Admin Panel Routes for Biblioteca Lumethos
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { extractUser, requireAuth, generateToken } = require('./middleware');
const { sendWhatsAppMessage, getStatus, disconnect: waDisconnect, refreshQR } = require('./whatsapp');

const router = express.Router();
const ADMIN_EMAIL = 'anderson.boscariol@gmail.com';

// Admin middleware — rejects non-admin users
function requireAdmin(req, res, next) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  }
  next();
}

// POST /api/admin/login — Admin login (verifies admin email)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha obrigatórios' });
    }
    if (email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Acesso restrito' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user.id);
    res.json({
      token,
      admin: { id: user.id, name: user.name, email: user.email }
    });
  } catch (e) {
    console.error('[admin] login error:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/admin/subscribers — List all subscribers
router.get('/subscribers', extractUser, requireAuth, requireAdmin, (req, res) => {
  const subscribers = db.getAllSubscribers();
  res.json({ subscribers });
});

// GET /api/admin/settings — Get WhatsApp template
router.get('/settings', extractUser, requireAuth, requireAdmin, (req, res) => {
  const template = db.getSetting('whatsapp_template');
  res.json({
    whatsapp_template: template || '',
    available_vars: [
      { var: '{{name}}', desc: 'Nome do assinante' },
      { var: '{{email}}', desc: 'E-mail do assinante' },
      { var: '{{password}}', desc: 'Senha do assinante' },
      { var: '{{phone}}', desc: 'Telefone do assinante' },
      { var: '{{link}}', desc: 'Link da biblioteca' }
    ]
  });
});

// PUT /api/admin/settings — Update WhatsApp template
router.put('/settings', extractUser, requireAuth, requireAdmin, (req, res) => {
  const { whatsapp_template } = req.body;
  if (!whatsapp_template || typeof whatsapp_template !== 'string') {
    return res.status(400).json({ error: 'Template é obrigatório' });
  }
  db.setSetting('whatsapp_template', whatsapp_template);
  res.json({ message: 'Template salvo com sucesso' });
});

// PUT /api/admin/subscribers/:id/phone — Update subscriber phone
router.put('/subscribers/:id/phone', extractUser, requireAuth, requireAdmin, (req, res) => {
  const { phone } = req.body;
  const userId = parseInt(req.params.id);
  if (!phone) return res.status(400).json({ error: 'Telefone obrigatório' });
  db.updateUserPhone(userId, phone);
  res.json({ message: 'Telefone atualizado' });
});

// POST /api/admin/subscribers/:id/send-whatsapp — Send WhatsApp to subscriber
router.post('/subscribers/:id/send-whatsapp', extractUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const subscriber = db.getSubscriberWithPassword(userId);
    if (!subscriber) return res.status(404).json({ error: 'Assinante não encontrado' });
    if (!subscriber.phone) return res.status(400).json({ error: 'Assinante não tem telefone cadastrado' });

    const template = db.getSetting('whatsapp_template');
    if (!template) return res.status(400).json({ error: 'Template de mensagem não configurado' });

    // Replace variables
    const message = template
      .replace(/\{\{name\}\}/g, subscriber.name)
      .replace(/\{\{email\}\}/g, subscriber.email)
      .replace(/\{\{password\}\}/g, subscriber.password_hash ? '***' : '***')
      .replace(/\{\{phone\}\}/g, subscriber.phone || '')
      .replace(/\{\{link\}\}/g, 'https://biblioteca.institutolumethos.online');

    const result = await sendWhatsAppMessage(subscriber.phone, message);
    res.json({ message: 'Mensagem enviada', result });
  } catch (e) {
    console.error('[admin] send-whatsapp error:', e);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// GET /api/admin/whatsapp/status — WhatsApp connection status + QR
router.get('/whatsapp/status', extractUser, requireAuth, requireAdmin, (req, res) => {
  const status = getStatus();
  res.json(status);
});

// POST /api/admin/whatsapp/refresh-qr — Force new QR code generation
router.post('/whatsapp/refresh-qr', extractUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    await refreshQR();
    res.json({ message: 'Novo QR code gerado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/whatsapp/disconnect — Disconnect WhatsApp
router.post('/whatsapp/disconnect', extractUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    await waDisconnect();
    res.json({ message: 'WhatsApp desconectado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/me — Check admin token
router.get('/me', extractUser, requireAuth, requireAdmin, (req, res) => {
  res.json({ admin: req.user });
});

module.exports = router;
