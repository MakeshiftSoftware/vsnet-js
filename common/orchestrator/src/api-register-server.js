const {
  FAILED_HEALTHCHECK_COUNTER_KEY,
  REGISTER_TIME_KEY,
  ACTIVE_CONNECTIONS_KEY,
} = require('./constants');

module.exports = redis => async (req, res, next) => {
  try {
    const name = req.body.name;
    const ip = req.body.ip;
    const port = req.body.port;

    const serverEntry = await redis.get(name);

    if (serverEntry) {
      // Server already registered.
      return res.sendStatus(200);
    }

    // Initialize server state in redis.
    await redis.hmset(name, {
      name,
      ip,
      port,
      [REGISTER_TIME_KEY]: new Date().toISOString(),
      [ACTIVE_CONNECTIONS_KEY]: 0,
      [FAILED_HEALTHCHECK_COUNTER_KEY]: 0,
    });

    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};
