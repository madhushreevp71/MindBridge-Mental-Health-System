const crypto = require('crypto');
const { query, one } = require('../config/db');

const newId = () => crypto.randomUUID();

const findByEmailAndRole = (email, role) =>
  one('SELECT * FROM users WHERE email = ? AND role = ?', [email.toLowerCase(), role]);

const findById = id => one('SELECT * FROM users WHERE id = ?', [id]);

async function create({ name, email, passwordHash, role }) {
  const id = newId();
  await query(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?,?,?,?,?)',
    [id, name, email.toLowerCase(), passwordHash, role]
  );
  return id;
}

const setActive = (id, active) => query('UPDATE users SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);

const idsByRole = async role => (await query('SELECT id FROM users WHERE role = ?', [role])).map(r => r.id);

// Admin "manage users" list, with doctor status when relevant.
const listAll = () => query(`
  SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
         d.verification_status, d.specialization
  FROM users u LEFT JOIN doctor_profiles d ON d.user_id = u.id
  ORDER BY u.created_at DESC`);

const countByRole = () => query('SELECT role, COUNT(*) AS n FROM users GROUP BY role');

module.exports = { newId, findByEmailAndRole, findById, create, setActive, idsByRole, listAll, countByRole };
