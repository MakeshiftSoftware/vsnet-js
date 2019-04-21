const ip = require('ip');
const request = require('request-promise');
const { app, server } = require('vsnet-common');
const WebsocketServer = require('./socket');
const { DEFAULT_REGISTER_START_DELAY, DEFAULT_REGISTER_RETRY_DELAY } = require('./constants');

const { SERVER_KEY, SERVER_NAME, ORCHESTRATOR_SERVICE } = process.env;

const REGISTER_START_DELAY = process.env.REGISTER_START_DELAY
  ? parseInt(process.env.REGISTER_START_DELAY, 10) * 1000
  : DEFAULT_REGISTER_START_DELAY;
const REGISTER_RETRY_DELAY = process.env.REGISTER_RETRY_DELAY
  ? parseInt(process.env.REGISTER_RETRY_DELAY, 10) * 1000
  : DEFAULT_REGISTER_RETRY_DELAY;

const registerServer = async server => {
  try {
    await request({
      method: 'POST',
      url: `${ORCHESTRATOR_SERVICE}/register-server`,
      body: {
        name: server.name,
        ip: server.ip,
        port: server.port,
      },
      json: true,
    });
  } catch (e) {
    setTimeout(() => registerServer(server), REGISTER_RETRY_DELAY);
  }
};

server({
  app: app(),
  beforeStart: server =>
    new WebsocketServer({
      server,
      serverKey: SERVER_KEY,
    }),
  afterStart: async server => {
    const serverInfo = {
      name: SERVER_NAME,
      ip: ip.address(),
      port: server.address().port,
    };

    setTimeout(registerServer(serverInfo), REGISTER_START_DELAY);
  },
  sharePort: false,
});
