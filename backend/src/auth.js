// auth.js — Register, Login, Me
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generateToken, extractUser, requireAuth } = require('./middleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = db.createUser(name, email, hash, null, password);

    // Create empty subscription record
    const token = generateToken(userId);

    res.status(201).json({
      token,
      user: { id: userId, name, email }
    });
  } catch (e) {
    console.error('[auth] register error:', e);
    res.status(500).json({ error: 'Erro interno ao criar conta' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = generateToken(user.id);
    const subscription = db.getSubscription(user.id);

    const active = subscription ? db.isSubscriptionActive(user.id) : false;

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      subscription: subscription ? {
        status: subscription.status,
        periodEnd: subscription.current_period_end,
        active
      } : { status: 'none', active: false }
    });
  } catch (e) {
    console.error('[auth] login error:', e);
    res.status(500).json({ error: 'Erro interno ao fazer login' });
  }
});

// GET /api/auth/me — Returns current user + subscription status
router.get('/me', extractUser, requireAuth, (req, res) => {
  const subscription = db.getSubscription(req.user.id);
  const active = db.isSubscriptionActive(req.user.id);

  res.json({
    user: req.user,
    subscription: subscription ? {
      status: subscription.status,
      periodEnd: subscription.current_period_end,
      active
    } : { status: 'none', active: false }
  });
});

// POST /api/auth/change-password
router.post('/change-password', extractUser, requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
    }

    const user = db.getUserById(req.user.id);
    const { getUserByEmail } = require('./db');
    const fullUser = db.getUserByEmail(user.email);

    const valid = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Senha atual inválida' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const db2 = require('./db');
    db2.getDb().prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, req.user.id);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (e) {
    console.error('[auth] change-password error:', e);
    res.status(500).json({ error: 'Erro interno ao alterar senha' });
  }
});

module.exports = router;
