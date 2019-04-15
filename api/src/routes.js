const express = require('express');
const {
  middleware: { requireAuth },
} = require('vsnet-common');
const { login, register } = require('./handlers');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/protected', requireAuth, (req, res) => {
  res.send('ok');
});

module.exports = router;
