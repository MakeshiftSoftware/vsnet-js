const express = require('express');
const { registerServer } = require('./handlers');

const router = express.Router();

router.post('/register-server', registerServer);

module.exports = router;
