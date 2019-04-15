const {
  createLogger,
  transports,
  format: { combine, timestamp, json },
} = require('winston');

const { LOG_LEVEL = 'debug', APP_NAME } = process.env;

if (!APP_NAME) {
  throw new Error('"APP_NAME" environment variable must be set');
}

const logger = createLogger({
  format: combine(timestamp(), json()),
  transports: [
    new transports.Console({
      level: LOG_LEVEL,
    }),
  ],
});

module.exports = {
  info: message => {
    logger.log({
      level: 'info',
      service: APP_NAME,
      message,
    });
  },
  error: message => {
    logger.log({
      level: 'error',
      service: APP_NAME,
      message,
    });
  },
  warn: message => {
    logger.log({
      level: 'warn',
      service: APP_NAME,
      message,
    });
  },
  debug: message => {
    logger.log({
      level: 'debug',
      service: APP_NAME,
      message,
    });
  },
  verbose: message => {
    logger.log({
      level: 'verbose',
      service: APP_NAME,
      message,
    });
  },
};
