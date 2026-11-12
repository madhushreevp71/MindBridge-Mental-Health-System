const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized, forbidden } = require('../utils/httpError');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized('Please sign in to continue.'));
  try {
    req.user = jwt.verify(token, config.jwt.secret);
    next();
  } catch {
    next(unauthorized('Your session has expired. Please sign in again.'));
  }
}

// requireRole('doctor') or requireRole('doctor', 'admin')
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user && req.user.role)
    ? next()
    : next(forbidden('You do not have permission to do that.'));

module.exports = { signToken, requireAuth, requireRole };
