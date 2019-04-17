const express = require('express');
const login = require('./api-login');
const register = require('./api-register');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

module.exports = router;
