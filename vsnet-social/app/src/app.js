const WebsocketServer = require('vsnet-sockets');
const { app, server } = require('paige-app-common');

const { REDIS_PUBSUB_URL, REDIS_PUBSUB_PASSWORD } = process.env;

server({
  app: app({
    auth: true,
  }),
  beforeStart: server =>
    WebsocketServer({
      server,
      pubsub: {
        url: REDIS_PUBSUB_URL,
        password: REDIS_PUBSUB_PASSWORD,
        channel: 'global',
      },
    }),
});
