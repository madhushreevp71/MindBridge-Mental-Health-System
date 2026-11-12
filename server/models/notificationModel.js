const { query } = require('../config/db');
const { newId } = require('./userModel');

const add = (userId, title, message) =>
  query('INSERT INTO notifications (id, user_id, title, message) VALUES (?,?,?,?)',
    [newId(), userId, title, String(message).slice(0, 600)]);

const addMany = (userIds, title, message) => Promise.all(userIds.map(id => add(id, title, message)));

const list = userId =>
  query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);

const markRead = (userId, id) =>
  query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
const markAllRead = userId => query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);

module.exports = { add, addMany, list, markRead, markAllRead };
