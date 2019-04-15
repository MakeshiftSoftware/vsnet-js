const Redis = require('ioredis');

const { REDIS_SERVICE, REDIS_SERVICE_PASSWORD } = process.env;

module.exports = new Redis(REDIS_SERVICE, {
  password: REDIS_SERVICE_PASSWORD,
});
