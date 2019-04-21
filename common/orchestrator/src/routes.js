const express = require('express');
const { registerServer } = require('./api-register-server');

module.exports = redis => {
  const router = express.Router();

  router.post('/register-server', registerServer(redis));

  return router;
};
