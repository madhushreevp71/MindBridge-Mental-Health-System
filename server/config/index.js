// Central place for every environment variable the server reads.
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET must be set when NODE_ENV=production.');
  process.exit(1);
}

module.exports = {
  isProd,
  port: Number(process.env.PORT || 4000),
  jwt: {
    secret: process.env.JWT_SECRET || 'mindbridge_dev_secret_change_me',
    expiresIn: '7d'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindbridge'
  },
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5'
  }
};
