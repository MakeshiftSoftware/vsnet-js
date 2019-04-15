const PubsubServer = require('vsnet-pubsub');
const { app, server } = require('vsnet-common');
const { publish, subscribe, clientServerMap } = require('./redis');

const { APP_SECRET, SERVER_NAME } = process.env;

server({
  app: app(),
  beforeStart: server =>
    new PubsubServer({
      server,
      publish,
      subscribe,
      clientServerMap,
      channel: SERVER_NAME,
      secret: APP_SECRET,
    }),
});
