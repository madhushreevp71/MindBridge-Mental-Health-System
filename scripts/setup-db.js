// Creates the database and all tables from database/schema.sql.
//   node scripts/setup-db.js          create if missing
//   node scripts/setup-db.js --drop   wipe the database first
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../server/config');

(async () => {
  const { database, ...conn } = config.db;
  const connection = await mysql.createConnection({ ...conn, multipleStatements: true });
  try {
    if (process.argv.includes('--drop')) {
      await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
      console.log(`Dropped database ${database}.`);
    }
    // schema.sql hard-codes "mindbridge"; swap in DB_NAME if you changed it.
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8')
      .replace(/mindbridge/g, database);
    await connection.query(sql);
    console.log(`Database "${database}" is ready.`);
  } finally {
    await connection.end();
  }
})().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
