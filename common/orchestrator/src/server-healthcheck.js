const request = require('request-promise');
const logger = require('vsnet-logger');
const distributedTask = require('./distributed-task');
const { HEALTHCHECK_LOCK_KEY, FAILED_HEALTHCHECK_COUNTER_KEY } = require('./constants');

class ServerHealthcheck {
  /**
   * Create a ServerHealthcheck instance.
   *
   * @param {Object} options Configuration options
   * @param {Redis} redis Redis client
   * @param {Number} interval How often to perform healthchecking
   * @param {Number} startDelay Seconds to wait before starting healthcheck
   * @param {Number} maxRetries Max number of failed healthchecks before killing server
   */
  constructor(options) {
    options = Object.assign(
      {
        redis: null,
        interval: null,
        startDelay: null,
        maxRetries: null,
      },
      options,
    );

    // @TODO: validate options

    this.options = options;
  }

  start() {
    distributedTask(
      this.performHealthcheck,
      this.options.interval,
      this.options.redis,
      HEALTHCHECK_LOCK_KEY,
      {
        startDelay: this.options.startDelay,
      },
    );
  }

  async performHealthcheck() {
    try {
      const allServerKeys = await this.getServerKeys();

      if (allServerKeys.length === 0) {
        logger.info('No servers registered. Skipping healthcheck.');
        return;
      }

      const serverData = await this.redis
        .multi([allServerKeys.map(key => ['hgetall', key])])
        .exec();

      // Perform healthcheck.
      const healthcheckResults = await Promise.all(
        serverData
          .map(data => request(`${data.ip}:${data.port}/healthz`))
          .map(promise => promise.catch(() => null)),
      );

      const healthyServers = [];
      const unhealthyServers = [];

      //  Mark healthy/unhealthy servers.
      for (let i = 0; i < healthcheckResults.length; i++) {
        if (healthcheckResults[i]) {
          healthyServers.push(serverData[i]);
        } else {
          logger.info(`${serverData[i].name} is unhealthy.`);
          unhealthyServers.push(serverData[i]);
        }
      }

      // Execute bulk redis commands for healthy servers.
      // Reset failed healthcheck counter to 0.
      await this.redis
        .multi(
          healthyServers.map(server => ['hset', server.name, FAILED_HEALTHCHECK_COUNTER_KEY, 0]),
        )
        .exec();

      // Execute bulk redis commands for unhealthy servers.
      // Incremement failed healthcheck counter.
      const healthcheckRetryCounts = await this.redis
        .multi(
          unhealthyServers.map(server => [
            'hincrby',
            server.name,
            FAILED_HEALTHCHECK_COUNTER_KEY,
            1,
          ]),
        )
        .exec();

      //
      // Gather unhealthy servers that need to be deleted.
      //
      const deleteServerKeys = unhealthyServers.filter((server, index) => {
        const retries = healthcheckRetryCounts[index][1];

        if (retries > this.options.maxRetries) {
          logger.info(
            `${server.name} exceeded max healthcheck retries and is marked for deletion.`,
          );
          return true;
        }

        return false;
      });

      // Delete dead servers from redis.
      if (deleteServerKeys.length > 0) {
        await this.redis.del(deleteServerKeys);
      }
    } catch (e) {
      logger.error(e.message);
    }
  }

  getServerKeys() {
    return new Promise((resolve, reject) => {
      try {
        // Create a readable stream to fetch redis keys.
        const stream = this.redis.scanStream();

        // Initialize set to hold redis keys.
        // Set is used to accumulate keys due to SCAN's implementation in redis
        // (resultKeys may contain 0 keys and will sometimes contain duplicates).
        const keySet = new Set();

        stream.on('data', keys => {
          for (let i = 0; i < keys.length; i++) {
            keySet.add(keys[i]);
          }
        });

        stream.on('end', () => {
          // Delete resource key from set.
          keySet.delete(HEALTHCHECK_LOCK_KEY);

          resolve(Array.from(keySet));
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = ServerHealthcheck;
