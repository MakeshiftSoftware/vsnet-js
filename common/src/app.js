const express = require('express');
const helmet = require('helmet');
const parser = require('body-parser');
const compression = require('compression');

/**
 * Create and return express app instance.
 *
 * @param {Object} options Configuration options
 * @param {Object} options.extensions Optional modules to add to app instance
 * @param {express.Router} router Additional routes to inject into app
 */
module.exports = options => {
  options = Object.assign(
    {
      extensions: null,
      router: null,
    },
    options,
  );

  //
  // Initialize app.
  //
  const app = express();

  //
  // Set security headers.
  //
  app.use(helmet());

  //
  // Compress responses.
  //
  app.use(compression());

  //
  // Parse incoming requests.
  //
  app.use(parser.json());

  app.use(
    parser.urlencoded({
      extended: false,
    }),
  );

  //
  // Setup healthcheck route.
  //
  app.get('/healthz', (req, res) => {
    res.sendStatus(200);
  });

  //
  // Optionally inject routes.
  //
  if (options.router) {
    app.use(options.router);
  }

  //
  // Optionally add extensions to app.
  //
  if (options.extensions) {
    Object.keys(options.extensions).forEach(key => {
      app[key] = options.extensions[key];
    });
  }

  //
  // Use global error handler.
  //
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return;
    }

    const responseBody = typeof err.json === 'function' ? err.json() : err.message;
    const responseCode = err.responseCode || 500;

    res.status(responseCode).send(responseBody);
  });

  return app;
};
