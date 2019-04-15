const { app, server } = require('vsnet-common');
const router = require('./routes');

server({
  app: app({
    router,
  }),
});
