const { query, one } = require('../config/db');
const { newId } = require('./userModel');

const DEFAULTS = [
  'Drink a glass of water',
  '10 minutes of quiet or meditation',
  'Stretch or take a short walk',
  'Message a friend or family member',
  'Write a few lines in a journal'
];

const list = userId => query('SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at, id', [userId]);

async function add(userId, text) {
  const id = newId();
  await query('INSERT INTO reminders (id, user_id, text) VALUES (?,?,?)', [id, userId, text]);
  return id;
}

const seedDefaults = userId => Promise.all(DEFAULTS.map(t => add(userId, t)));

const find = (userId, id) => one('SELECT * FROM reminders WHERE id = ? AND user_id = ?', [id, userId]);
const setDone = (id, done) => query('UPDATE reminders SET done = ? WHERE id = ?', [done ? 1 : 0, id]);
const remove = (userId, id) => query('DELETE FROM reminders WHERE id = ? AND user_id = ?', [id, userId]);

module.exports = { list, add, seedDefaults, find, setDone, remove };
