// middleware.js — JWT verification & auth guards
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[middleware] No JWT_SECRET in env, using dev fallback');
  return 'dev-jwt-secret-do-not-use-in-production';
})();

const JWT_EXPIRES = '7d';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Express middleware: extracts user from JWT header or query param ?token=
function extractUser(req, res, next) {
  // Try Authorization header first
  const auth = req.headers.authorization;
  let token = null;
  if (auth && auth.startsWith('Bearer ')) {
    token = auth.slice(7);
  } else if (req.query && req.query.token) {
    // Fallback: token from query param (for direct window.open/redirect calls)
    token = req.query.token;
  }
  if (!token) {
    req.user = null;
    return next();
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    req.user = null;
    return next();
  }
  req.user = db.getUserById(decoded.userId);
  if (!req.user) req.user = null;
  next();
}

// Express middleware: requires authenticated user
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
  }
  next();
}

// Express middleware: requires active subscription
function requireSubscription(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
  }
  if (!db.isSubscriptionActive(req.user.id)) {
    return res.status(403).json({ error: 'Assinatura necessária', code: 'SUBSCRIPTION_REQUIRED' });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  extractUser,
  requireAuth,
  requireSubscription
};
