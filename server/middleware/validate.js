const { badRequest } = require('../utils/httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmail = v => EMAIL_RE.test(String(v || '').trim());
const clean = v => String(v == null ? '' : v).trim();

// require(body, ['name','email']) -> throws 400 naming the first missing field
function requireFields(body, fields, labels = {}) {
  for (const f of fields) {
    if (!clean(body[f])) throw badRequest(`Please fill in ${labels[f] || f}.`);
  }
}

module.exports = { isEmail, clean, requireFields };
