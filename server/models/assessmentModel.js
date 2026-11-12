const { query, one } = require('../config/db');

const add = ({ userId, phq, gad, total, severity }) => query(
  'INSERT INTO assessments (user_id, phq_score, gad_score, total_score, severity) VALUES (?,?,?,?,?)',
  [userId, phq, gad, total, severity]);

const latest = userId => one(
  'SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1', [userId]);

const history = (userId, limit = 12) => query(
  'SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?', [userId, limit]);

module.exports = { add, latest, history };
