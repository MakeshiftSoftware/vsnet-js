const Redis = require('ioredis');

const { REDIS_PUBSUB, REDIS_PUBSUB_PASSWORD, REDIS_STORE, REDIS_STORE_PASSWORD } = process.env;

module.exports = {
  publish: new Redis(REDIS_PUBSUB, { password: REDIS_PUBSUB_PASSWORD }),
  subscribe: new Redis(REDIS_PUBSUB, { password: REDIS_PUBSUB_PASSWORD }),
  clientServerMap: new Redis(REDIS_STORE, { password: REDIS_STORE_PASSWORD }),
};
