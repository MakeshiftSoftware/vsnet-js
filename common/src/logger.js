const {
  createLogger,
  transports,
  format: { combine, timestamp, json },
} = require('winston');

module.exports = (appName, logLevel = 'debug') => {
  const logger = createLogger({
    format: combine(timestamp(), json()),
    transports: [
      new transports.Console({
        level: logLevel,
      }),
    ],
  });

  return {
    info: message => {
      logger.log({
        level: 'info',
        service: appName,
        message,
      });
    },
    error: message => {
      logger.log({
        level: 'error',
        service: appName,
        message,
      });
    },
    warn: message => {
      logger.log({
        level: 'warn',
        service: appName,
        message,
      });
    },
    debug: message => {
      logger.log({
        level: 'debug',
        service: appName,
        message,
      });
    },
    verbose: message => {
      logger.log({
        level: 'verbose',
        service: appName,
        message,
      });
    },
  };
};
