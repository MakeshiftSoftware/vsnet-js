const Redis = require('ioredis');

const { REDIS_STORE, REDIS_STORE_PASSWORD } = process.env;

module.exports = new Redis(REDIS_STORE, { password: REDIS_STORE_PASSWORD });
