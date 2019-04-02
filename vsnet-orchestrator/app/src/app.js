const { app: createApp, server, redis } = require('paige-app-common');
const router = require('./routes');

const { REDIS_DATABASE_URL, REDIS_DATABASE_PASSWORD } = process.env;

const app = createApp({
  router,
  auth: true,
});

app.redis = redis(REDIS_DATABASE_URL, {
  password: REDIS_DATABASE_PASSWORD,
});

server({ app });
