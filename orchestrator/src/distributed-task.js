const { logger } = require('vsnet-common');

module.exports = async (task, taskInterval, redis, resource, options) => {
  options = Object.assign(
    {
      retryDelay: 200,
      startDelay: 0,
    },
    options,
  );

  const performTask = async () => {
    try {
      const result = await redis.set(resource, 1, 'NX', 'PX', taskInterval);

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
