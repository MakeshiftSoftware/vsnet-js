const redis = require('../redis');
const {
  FAILED_HEALTHCHECK_COUNTER_KEY,
  REGISTER_TIME_KEY,
  ACTIVE_CONNECTIONS_KEY,
} = require('../constants');

module.exports = async (req, res, next) => {
  try {
    const name = req.body.name;
    const ip = req.body.ip;
    const port = req.body.port;

    //
    // Initialize server state in redis.
    //
    await redis.hmset(name, {
      name,
      ip,
      port,
      [REGISTER_TIME_KEY]: new Date().toISOString(),
      [ACTIVE_CONNECTIONS_KEY]: 0,
      [FAILED_HEALTHCHECK_COUNTER_KEY]: 0,
    });

    res.send();
  } catch (e) {
    next(e);
  }
};
