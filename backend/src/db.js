// db.js — SQLite Database for Biblioteca Lumethos Auth
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'biblioteca.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

const ADMIN_EMAIL = 'anderson.boscariol@gmail.com';

function initTables() {
  // Add phone column if not exists (safe migration)
  const hasPhone = db.prepare("PRAGMA table_info('users')").all().some(c => c.name === 'phone');
  const hasPlainPw = db.prepare("PRAGMA table_info('users')").all().some(c => c.name === 'plain_password');
  
  if (!hasPlainPw) {
    db.exec("ALTER TABLE users ADD COLUMN plain_password TEXT");
    console.log('[db] Added plain_password column');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plain_password TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      status TEXT NOT NULL DEFAULT 'inactive' CHECK(status IN ('active','past_due','canceled','expired','inactive','trialing')),
      current_period_start TEXT,
      current_period_end TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON users(id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

    -- Admin settings (key-value store)
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Insert default WhatsApp template
  db.prepare(`INSERT OR IGNORE INTO admin_settings (key, value) VALUES (?, ?)`).run(
    'whatsapp_template',
    '🎉 Olá {{name}}!\n\nSua assinatura da Biblioteca Lumethos está ativa! 🎊\n\n📚 Acesse aqui: https://biblioteca.institutolumethos.online\n📧 E-mail: {{email}}\n🔑 Senha: {{password}}\n\n✅ Já pode entrar e acessar todo o acervo teológico!\n\nQualquer dúvida, responda essa mensagem.'
  );

  // Create default admin user for Anderson
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (count.c === 0) {
    console.log('[db] Creating default admin user...');
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('@Danilailav7', 10);
    db.prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)').run(
      'Anderson Boscariol', ADMIN_EMAIL, hash, '5511920725364'
    );
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
    db.prepare(`INSERT INTO subscriptions (user_id, status, current_period_start, current_period_end)
      VALUES (?, 'active', datetime('now'), datetime('now', '+10 years'))`).run(user.id);
    console.log('[db] Admin user created: ' + ADMIN_EMAIL);
  }
}

// === User Queries ===
function createUser(name, email, passwordHash, phone, plainPassword) {
  const d = getDb();
  const stmt = d.prepare('INSERT INTO users (name, email, password_hash, plain_password, phone) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(name, email, passwordHash, plainPassword || null, phone || null);
  return result.lastInsertRowid;
}

function getUserByEmail(email) {
  const d = getDb();
  return d.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function getUserById(id) {
  const d = getDb();
  return d.prepare('SELECT id, name, email, phone, created_at, avatar_url FROM users WHERE id = ?').get(id);
}

function getUserByIdWithPassword(id) {
  const d = getDb();
  return d.prepare('SELECT id, name, email, phone, plain_password FROM users WHERE id = ?').get(id);
}

function isAdmin(email) {
  return email === ADMIN_EMAIL;
}

// === Subscription Queries ===
function getSubscription(userId) {
  const d = getDb();
  return d.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);
}

function createSubscription(userId, customerId, subId, periodEnd) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end)
    VALUES (?, ?, ?, 'active', datetime('now'), ?)
  `);
  return stmt.run(userId, customerId, subId, periodEnd);
}

function activateSubscription(subId, periodEnd) {
  const d = getDb();
  const stmt = d.prepare(`
    UPDATE subscriptions SET status = 'active', current_period_end = ?, updated_at = datetime('now')
    WHERE stripe_subscription_id = ?
  `);
  return stmt.run(periodEnd, subId);
}

function expireSubscription(subId) {
  const d = getDb();
  const stmt = d.prepare(`
    UPDATE subscriptions SET status = 'expired', updated_at = datetime('now')
    WHERE stripe_subscription_id = ?
  `);
  return stmt.run(subId);
}

function isSubscriptionActive(userId) {
  const sub = getSubscription(userId);
  if (!sub) return false;
  if (sub.status !== 'active') return false;
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
    expireSubscription(sub.stripe_subscription_id);
    return false;
  }
  return true;
}

// === Admin Queries ===
function getAllSubscribers() {
  const d = getDb();
  return d.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.created_at as user_created,
           COALESCE(s.status, 'none') as sub_status,
           s.current_period_start, s.current_period_end,
           s.stripe_customer_id, s.stripe_subscription_id
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    WHERE u.email != ?
    ORDER BY COALESCE(s.current_period_end, u.created_at) DESC
  `).all(ADMIN_EMAIL);
}

function getSetting(key) {
  const d = getDb();
  const row = d.prepare('SELECT value FROM admin_settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  const d = getDb();
  d.prepare(`INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`).run(key, value);
}

function updateUserPhone(userId, phone) {
  const d = getDb();
  d.prepare("UPDATE users SET phone = ?, updated_at = datetime('now') WHERE id = ?").run(phone, userId);
}

function updateUserPassword(userId, passwordHash, plainPassword) {
  const d = getDb();
  d.prepare("UPDATE users SET password_hash = ?, plain_password = ?, updated_at = datetime('now') WHERE id = ?").run(passwordHash, plainPassword, userId);
}

function getSubscriberWithPassword(userId) {
  const d = getDb();
  return d.prepare('SELECT id, name, email, phone, password_hash FROM users WHERE id = ?').get(userId);
}

// === Cleanup ===
function close() {
  if (db) db.close();
}

module.exports = {
  getDb,
  close,
  createUser,
  getUserByEmail,
  getUserById,
  isAdmin,
  getSubscription,
  createSubscription,
  activateSubscription,
  expireSubscription,
  isSubscriptionActive,
  getAllSubscribers,
  getSetting,
  setSetting,
  updateUserPhone,
  getSubscriberWithPassword,
  getUserByIdWithPassword,
  updateUserPassword
};
