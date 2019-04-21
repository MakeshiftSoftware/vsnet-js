const Redis = require('ioredis');
const app = require('vsnet-app');
const server = require('vsnet-server');
const createRouter = require('./routes');
const ServerHealthcheck = require('./server-healthcheck');
const {
  DEFAULT_HEALTHCHECK_INTERVAL,
  DEFAULT_HEALTHCHECK_MAX_RETRIES,
  DEFAULT_HEALTHCHECK_START_DELAY,
} = require('./constants');

class Orchestrator {
  /**
   * Create an Orchestrator instance.
   *
   * @param {Object} options Configuration options
   * @param {String} options.redis Redis connection string
   * @param {Number} options.maxClients Max client connections per server
   * @param {Number} options.healthcheckInterval
   * @param {Number} options.healthcheckStartDelay
   * @param {Number} options.healthcheckMaxRetries
   * @param {String} options.healthcheckLockKey
   * @param {String} options.failedHealthcheckCounterKey
   */
  constructor(options) {
    options = Object.assign(
      {
        redis: null,
        maxClients: null,
        healthcheckInterval: null,
        healthcheckStartDelay: null,
        healthcheckMaxRetries: null,
      },
      options,
    );

    if (!options.redis) {
      throw new TypeError('"redis" option must be specified');
    }

    if (!options.maxClients) {
      throw new TypeError('"maxClients" option must be specified');
    }

    const healthcheckInterval = options.healthcheckInterval
      ? parseInt(options.healthcheckInterval, 10) * 1000
      : DEFAULT_HEALTHCHECK_INTERVAL;

    const healthcheckStartDelay = options.healthcheckStartDelay
      ? parseInt(options.healthcheckStartDelay, 10) * 1000
      : DEFAULT_HEALTHCHECK_START_DELAY;

    const healthcheckMaxRetries = options.healthcheckMaxRetries
      ? parseInt(options.healthcheckMaxRetries, 10)
      : DEFAULT_HEALTHCHECK_MAX_RETRIES;

    this.redis = new Redis(options.redis);

    this.serverHealthcheck = new ServerHealthcheck({
      redis: this.redis,
      interval: healthcheckInterval,
      startDelay: healthcheckStartDelay,
      maxRetries: healthcheckMaxRetries,
    });

    server({
      app: app({
        router: createRouter(this.redis),
        bodyParser: true,
      }),
      afterStart: () => this.serverHealthcheck.start(),
    });
  }
}

module.exports = Orchestrator;
