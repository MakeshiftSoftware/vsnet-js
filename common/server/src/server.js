/* eslint-disable no-process-exit */
const http = require('http');
const os = require('os');
const cluster = require('cluster');

const startServer = async options => {
  const { port } = process.env;

  const server = http.createServer(options.app);

  if (options.beforeStart) {
    await Promise.resolve(options.beforeStart(server));
  }

  server.listen(port, async () => {
    process.on('SIGINT', () => {
      stopServer(options);
    });

    process.on('SIGTERM', () => {
      stopServer(options);
    });

    if (options.afterStart) {
      await Promise.resolve(options.afterStart(server));
    }
  });
};

const stopServer = async options => {
  try {
    if (options.beforeStop) {
      await Promise.resolve(options.beforeStop());
    }

    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
};

module.exports = options => {
  options = Object.assign(
    {
      app: null,
      sharePort: true,
      beforeStart: null,
      afterStart: null,
      beforeStop: null,
    },
    options,
  );

  const pidToPort = {};

  if (cluster.isMaster) {
    cluster.on('exit', worker => {
      if (!worker.exitedAfterDisconnect) {
        // Get the port that is now missing and create new worker
        // with that port. Also, delete old pidToPort mapping and
        // add the new one.
        const port = pidToPort[worker.process.pid];
        delete pidToPort[worker.process.pid];

        const newWorker = cluster.fork({ port });
        pidToPort[newWorker.process.pid] = port;
      }
    });

    const basePort = Number.parseInt(options.port, 10);

    for (let i = 0; i < os.cpus().length; ++i) {
      const portAdd = options.sharePort ? 0 : i;
      const port = basePort + portAdd;
      const worker = cluster.fork({ port });
      pidToPort[worker.process.pid] = port;
    }
  } else {
    startServer(options);
  }
};
