const express = require('express');
const { findMatch } = require('./match');

const router = express.Router();

router.post('/find-match', findMatch);

module.exports = router;
