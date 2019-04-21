const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

/**
 * Create app instance with various options.
 *
 * @param {Object} options Configuration options
 * @param {express.Router} router Additional routes to inject into app
 * @param {Boolean} secureHeaders Set various response headers
 * @param {Boolean} compression Compress responses with gzip
 * @param {Boolean} bodyParser Parse incoming request bodies
 * @param {Function} healthcheckFunction Function to call during healthcheck
 * @param {String} healthcheckRoute Route to use for healthchecking
 * @param {Function} readinessFunction Function to call during readiness check
 * @param {String} readinessRoute Route to use for readiness checking
 */
module.exports = options => {
  options = Object.assign(
    {
      router: null,
      secureHeaders: true,
      compression: true,
      bodyParser: false,
      healthcheckFunction: null,
      healthcheckRoute: '/healthz',
      readinessFunction: null,
      readinessRoute: '/healthz',
    },
    options,
  );

  // Initialize app.
  const app = express();

  // Optionally set security headers.
  if (options.secureHeaders) {
    app.use(helmet());
  }

  // Gzip responses.
  if (options.compression) {
    app.use(compression());
  }

  // Parse body of incoming requests.
  if (options.bodyParser) {
    app.use(express.json());
  }

  // Setup healthcheck route.
  app.get(options.healthcheckRoute, async (req, res) => {
    let ok = true;

    if (options.healthcheckFunction) {
      ok = await Promise.resolve(options.healthcheckFunction());
    }

    if (ok) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  });

  // Setup readiness check route if provided and different from healthcheck route.
  if (options.readinessRoute !== options.healthcheckRoute) {
    app.get(options.readinessRoute, async (req, res) => {
      let ok = true;

      if (options.readinessFunction) {
        ok = await Promise.resolve(options.readinessFunction());
      }

      if (ok) {
        res.sendStatus(200);
      } else {
        res.sendStatus(500);
      }
    });
  }

  // Optionally inject routes.
  if (options.router) {
    app.use(options.router);
  }

  // Setup global error handler.
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return;
    }

    res.status(500).send({ message: err.message });
  });

  return app;
};
