const Redis = require('ioredis');

const {
  REDIS_PUBSUB,
  REDIS_PUBSUB_PASSWORD,
  REDIS_SESSIONS,
  REDIS_SESSIONS_PASSWORD,
} = process.env;

module.exports = {
  publish: new Redis(REDIS_PUBSUB, { password: REDIS_PUBSUB_PASSWORD }),
  subscribe: new Redis(REDIS_PUBSUB, { password: REDIS_PUBSUB_PASSWORD }),
  sessions: new Redis(REDIS_SESSIONS, { password: REDIS_SESSIONS_PASSWORD }),
};
