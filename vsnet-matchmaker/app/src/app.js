const Redis = require('ioredis');
const { app, server } = require('paige-app-common');
const router = require('./routes');

const { REDIS_DATABASE_URL, REDIS_DATABASE_PASSWORD } = process.env;

server({
  app: app({
    router,
    auth: true,
    extensions: {
      redis: new Redis(REDIS_DATABASE_URL, {
        password: REDIS_DATABASE_PASSWORD,
      }),
    },
  }),
});
