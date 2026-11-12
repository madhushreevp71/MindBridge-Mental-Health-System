const config = require('./config');
const app = require('./app');
const { pool } = require('./config/db');

async function start() {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('\n✖ Could not connect to MySQL:', err.message);
    console.error('  Check DB_* values in .env, make sure MySQL is running and `npm run db:setup` has been run.\n');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`\n  MindBridge is running → http://localhost:${config.port}`);
    console.log(`  Database : ${config.db.database}@${config.db.host}`);
    console.log(`  AI chat  : ${config.ai.apiKey ? 'Claude (' + config.ai.model + ')' : 'keyword fallback (no ANTHROPIC_API_KEY)'}\n`);
  });
}

start();
