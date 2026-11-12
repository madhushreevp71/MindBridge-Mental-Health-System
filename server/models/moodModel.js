const { query } = require('../config/db');

const add = ({ userId, score, tags, note }) =>
  query('INSERT INTO mood_entries (user_id, score, tags, note) VALUES (?,?,?,?)',
    [userId, score, tags.join(','), note || null]);

// Newest-last list of the last N days.
const recent = (userId, days) => query(
  `SELECT id, score, tags, note, created_at FROM mood_entries
   WHERE user_id = ? AND created_at >= (UTC_TIMESTAMP() - INTERVAL ? DAY)
   ORDER BY created_at ASC`, [userId, days]);

const total = async userId =>
  (await query('SELECT COUNT(*) AS n FROM mood_entries WHERE user_id = ?', [userId]))[0].n;

module.exports = { add, recent, total };
