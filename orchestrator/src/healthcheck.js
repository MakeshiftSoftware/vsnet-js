const request = require('request-promise');
const { logger } = require('vsnet-common');
const redis = require('./redis');
const distributedTask = require('./distributed-task');
const {
  LOCK_RESOURCE_KEY,
  FAILED_HEALTHCHECK_COUNTER_KEY,
  DEFAULT_HEALTHCHECK_INTERVAL,
  DEFAULT_HEALTHCHECK_MAX_RETRIES,
  DEFAULT_HEALTHCHECK_START_DELAY,
} = require('./constants');

const HEALTHCHECK_INTERVAL = process.env.HEALTHCHECK_INTERVAL
  ? parseInt(process.env.HEALTHCHECK_INTERVAL, 10) * 1000
  : DEFAULT_HEALTHCHECK_INTERVAL;
const HEALTHCHECK_MAX_RETRIES = process.env.HEALTHCHECK_MAX_RETRIES
  ? parseInt(process.env.HEALTHCHECK_MAX_RETRIES, 10)
  : DEFAULT_HEALTHCHECK_MAX_RETRIES;
const HEALTHCHECK_START_DELAY = process.env.HEALTHCHECK_START_DELAY
  ? parseInt(process.env.HEALTHCHECK_START_DELAY, 10) * 1000
  : DEFAULT_HEALTHCHECK_START_DELAY;

const getServerKeys = () =>
  new Promise((resolve, reject) => {
    try {
      //
      // Create a readable stream to fetch redis keys.
      //
      const stream = redis.scanStream();

      //
      // Initialize set to hold redis keys.
      // Set is used to accumulate keys due to SCAN's implementation in redis
      // (resultKeys may contain 0 keys and will sometimes contain duplicates).
      //
      const keySet = new Set();

      stream.on('data', keys => {
        for (let i = 0; i < keys.length; i++) {
          keySet.add(keys[i]);
        }
      });

      stream.on('end', () => {
        //
        // Delete resource key from set.
        //
        keySet.delete(LOCK_RESOURCE_KEY);

        resolve(Array.from(keySet));
      });
    } catch (e) {
      reject(e);
    }
  });

const performHealthcheck = async () => {
  try {
    logger.info('Performing server healthcheck');

    const allServerKeys = await getServerKeys();

    if (allServerKeys.length === 0) {
      logger.info('No servers registered. Skipping healthcheck.');
      return;
    }

    const serverData = await redis.multi([allServerKeys.map(key => ['hgetall', key])]).exec();

    //
    // Perform healthcheck.
    //
    const healthcheckResults = await Promise.all(
      serverData
        .map(data => request(`${data.ip}:${data.port}/healthz`))
        .map(promise => promise.catch(() => null)),
    );

    const healthyServers = [];
    const unhealthyServers = [];

    //
    //  Mark healthy/unhealthy servers.
    //
    for (let i = 0; i < healthcheckResults.length; i++) {
      if (healthcheckResults[i]) {
        healthyServers.push(serverData[i]);
      } else {
        logger.info(`${serverData[i].name} is unhealthy.`);
        unhealthyServers.push(serverData[i]);
      }
    }

    //
    // Execute bulk redis commands for healthy servers.
    // Reset failed healthcheck counter to 0.
    //
    await redis
      .multi(healthyServers.map(server => ['hset', server.name, FAILED_HEALTHCHECK_COUNTER_KEY, 0]))
      .exec();

    //
    // Execute bulk redis commands for unhealthy servers.
    // Incremement failed healthcheck counter.
    //
    const healthcheckRetryCounts = await redis
      .multi(
        unhealthyServers.map(server => ['hincrby', server.name, FAILED_HEALTHCHECK_COUNTER_KEY, 1]),
      )
      .exec();

    //
    // Gather unhealthy servers that need to be deleted.
    //
    const deleteServerKeys = unhealthyServers.filter((server, index) => {
      const retries = healthcheckRetryCounts[index][1];

      if (retries > HEALTHCHECK_MAX_RETRIES) {
        logger.info(`${server.name} exceeded max healthcheck retries and is marked for deletion.`);
        return true;
      }

      return false;
    });

    //
    // Delete dead servers from redis.
    //
    if (deleteServerKeys.length > 0) {
      await redis.del(deleteServerKeys);
    }
  } catch (e) {
    logger.error(e.message);
  }
};

module.exports = () => {
  distributedTask(performHealthcheck, HEALTHCHECK_INTERVAL, redis, LOCK_RESOURCE_KEY, {
    startDelay: HEALTHCHECK_START_DELAY,
  });
};
