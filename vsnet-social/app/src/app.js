const { app: createApp, server, redis } = require('paige-app-common');

const { REDIS_PUBSUB_URL, REDIS_PUBSUB_PASSWORD } = process.env;

const app = createApp({
  auth: true,
});

const pub = redis(REDIS_PUBSUB_URL, {
  password: REDIS_PUBSUB_PASSWORD,
});

const sub = redis(REDIS_PUBSUB_URL, {
  password: REDIS_PUBSUB_PASSWORD,
});

server({ app });
