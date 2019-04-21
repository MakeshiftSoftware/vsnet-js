const { app, server } = require('vsnet-common');
const PubsubServer = require('vsnet-pubsub');

const { SERVER_KEY, SERVER_NAME, REDIS_PUBSUB, REDIS_SESSIONS } = process.env;

server({
  app: app(),
  beforeStart: server =>
    new PubsubServer({
      server,
      pubsub: REDIS_PUBSUB,
      sessions: REDIS_SESSIONS,
      channel: SERVER_NAME,
      serverKey: SERVER_KEY,
    }),
});
