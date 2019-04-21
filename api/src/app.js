const app = require('vsnet-app');
const server = require('vsnet-server');
const router = require('./routes');

server({
  app: app({
    router,
    bodyParser: true,
  }),
});
