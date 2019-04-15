const { app, server } = require('vsnet-common');
const router = require('./routes');
const startHealthcheck = require('./healthcheck');

server({
  app: app({
    router,
  }),
  afterStart: () => startHealthcheck(),
});
