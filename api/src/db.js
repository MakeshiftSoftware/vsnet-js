const knex = require('knex');
const dbConfig = require('./db-config');

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('environment variable DATABASE_URL must be set');
}

module.exports = knex(dbConfig);
