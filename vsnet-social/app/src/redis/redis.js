const Redis = require('ioredis');

module.exports = (options = {}) => {
  if (!options.url) {
    throw new Error('No redis url specified');
  }

  return new Redis(options.url, {
    lazyConnect: true,
    autoResendUnfulfilledCommands: true,
    autoResubscribe: true,
    ...options,
  });
};
