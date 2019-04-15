/* eslint-disable no-process-exit */
const http = require('http');
const os = require('os');
const cluster = require('cluster');
const logger = require('./logger');

const { PORT } = process.env;

if (!PORT) {
  throw new Error('environment variable PORT must be set');
}

const start = async options => {
  const { port } = process.env;

  const server = http.createServer(options.app);

  if (options.beforeStart) {
    await Promise.resolve(options.beforeStart(server));
  }

  server.listen(port, async () => {
    process.on('SIGINT', () => {
      stop(options);
    });

    process.on('SIGTERM', () => {
      stop(options);
    });

    logger.info(`Server listening on ${port}`);

    if (options.afterStart) {
      await Promise.resolve(options.afterStart(server));
    }
  });
};

const stop = async options => {
  try {
    logger.info('Stopping server gracefully');

    if (options.beforeStop) {
      await Promise.resolve(options.beforeStop());
    }

    process.exit(0);
  } catch (e) {
    logger.error(`Error stopping server: ${e.message}`);

    process.exit(1);
  }
};

module.exports = options => {
  options = Object.assign(
    {
      sharePort: true,
      beforeStart: null,
      afterStart: null,
      beforeStop: null,
      app: null,
    },
    options,
  );

  const pidToPort = {};

  if (cluster.isMaster) {
    logger.info('Creating workers');

    cluster.on('exit', worker => {
      if (!worker.exitedAfterDisconnect) {
        logger.error(`Worker has died: ${worker.process.pid}`);
        logger.info('Spawning new worker');

        //
        // Get the port that is now missing and create new worker
        // with that port. Also, delete old pidToPort mapping and
        // add the new one.
        //
        const port = pidToPort[worker.process.pid];
        delete pidToPort[worker.process.pid];

        const newWorker = cluster.fork({ port });
        pidToPort[newWorker.process.pid] = port;
      }
    });

    cluster.on('fork', worker => {
      logger.info(`Forked new worker with pid ${worker.process.pid}`);
    });

    const basePort = Number.parseInt(PORT, 10);

    for (let i = 0; i < os.cpus().length; ++i) {
      const portAdd = options.sharePort ? 0 : i;
      const port = basePort + portAdd;
      const worker = cluster.fork({ port });
      pidToPort[worker.process.pid] = port;
    }
  } else {
    start(options);
  }
};
