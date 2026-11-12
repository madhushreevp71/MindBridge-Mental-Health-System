const { query } = require('../config/db');

const add = ({ userId, sender, body, sentiment = null, crisis = false, source = null }) =>
  query(
    'INSERT INTO chat_messages (user_id, sender, body, sentiment, is_crisis, source) VALUES (?,?,?,?,?,?)',
    [userId, sender, body, sentiment, crisis ? 1 : 0, source]);

// Last N messages, returned oldest -> newest.
async function recent(userId, limit = 60) {
  const rows = await query(
    'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?', [userId, limit]);
  return rows.reverse();
}

const clear = userId => query('DELETE FROM chat_messages WHERE user_id = ?', [userId]);

module.exports = { add, recent, clear };
