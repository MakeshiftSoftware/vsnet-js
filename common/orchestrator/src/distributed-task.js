const logger = require('vsnet-logger');

/**
 * Perform a task a maximum of once every taskInterval period.
 *
 * @param {Function} task Task to perform
 * @param {Number} taskInterval How long before expiring lock
 * @param {Redis} redis Redis client
 * @param {String} resourceKey Name of resource key in redis
 * @param {Object} options Configuration options
 * @param {Number} options.retryDelay How long to wait before retrying to acquire lock
 * @param {Number} options.startDelay How long to delay before starting task
 */
module.exports = async (task, taskInterval, redis, resourceKey, options) => {
  options = Object.assign(
    {
      retryDelay: 200,
      startDelay: 0,
    },
    options,
  );

  const performTask = async () => {
    try {
      const result = await redis.set(resourceKey, 1, 'NX', 'PX', taskInterval);

      if (result === 'OK') {
        task();
      }
    } catch (e) {
      logger.error(e.message);
    } finally {
      setTimeout(performTask, options.retryDelay);
    }
  };

  setTimeout(performTask, options.startDelay);
};
