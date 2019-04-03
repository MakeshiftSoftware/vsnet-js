const express = require('express');

const router = express.Router();

require('./test')(router);

module.exports = router;
