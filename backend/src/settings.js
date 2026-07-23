// settings.js — Avatar upload, profile settings
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('./middleware');
const db = require('./db');

const router = express.Router();

// Ensure avatars directory exists
const AVATAR_DIR = path.join(__dirname, '../../frontend/dist/avatars');
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    // user_<id>_<timestamp>.ext
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = 'user_' + req.user.id + '_' + Date.now() + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Use JPG, PNG ou WEBP.'));
    }
  }
});

// POST /api/settings/avatar — Upload avatar image
router.post('/avatar', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, function(err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Máximo 2MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const avatarUrl = '/avatars/' + req.file.filename;
    
    // Update user record with avatar URL (safe migration)
    try {
      db.getDb().prepare('ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT NULL').run();
    } catch(e) {
      // Column already exists, ignore
    }
    db.getDb().prepare('UPDATE users SET avatar_url = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(avatarUrl, req.user.id);

    res.json({ url: avatarUrl });
  });
});

// POST /api/settings/name — Update user name
router.post('/name', requireAuth, (req, res) => {
  var name = req.body && req.body.name && req.body.name.trim();
  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
  }
  try {
    db.getDb().prepare('UPDATE users SET name = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(name, req.user.id);
    res.json({ message: 'Nome atualizado', name: name });
  } catch (e) {
    console.error('[settings] name error:', e);
    res.status(500).json({ error: 'Erro interno ao atualizar nome' });
  }
});

module.exports = router;
