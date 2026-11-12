// MySQL connection pool + tiny query helpers used by every model.
const mysql = require('mysql2/promise');
const config = require('./index');

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  dateStrings: ['DATE'] // appt_date stays "2026-11-20" instead of becoming a JS Date
});

// Keep every session in UTC so timestamps are consistent no matter where MySQL runs.
pool.pool.on('connection', conn => conn.query("SET time_zone = '+00:00'"));

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { pool, query, one };
