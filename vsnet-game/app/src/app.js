const Redis = require('ioredis');
const WebsocketServer = require('vsnet-sockets');
const { app, server } = require('paige-app-common');

const { REDIS_DATABASE_URL, REDIS_DATABASE_PASSWORD } = process.env;

server({
  app: app({
    auth: true,
  }),
  beforeStart: server =>
    WebsocketServer({
      server,
      extensions: {
        redis: new Redis(REDIS_DATABASE_URL, {
          password: REDIS_DATABASE_PASSWORD,
        }),
      },
    }),
});
