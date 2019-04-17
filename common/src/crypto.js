const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ROUNDS = 10;

/**
 * Generate auth token.
 *
 * @param {Object} user User object
 * @param {String} secret Secret for signing
 */
const authToken = (user, secret) => {
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    secret,
  );

  return `JWT ${token}`;
};

/**
 * Generate a random token for resetting account information.
 *
 * @param {Number} length Token length
 */
const resetToken = (length = 32) =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(Math.ceil(length / 2), (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf.toString('hex'));
      }
    });
  });

/**
 * Hash and salt password using bcrypt (async)
 *
 * @param {String} password Plain text password
 */
const encrypt = password =>
  new Promise((resolve, reject) => {
    bcrypt.genSalt(ROUNDS, (error, salt) => {
      bcrypt.hash(password, salt, (err, hash) => (err ? reject(err) : resolve(hash)));
    });
  });

/**
 * Hash and salt password using bcrypt (sync)
 *
 * @param {String} password Plain text password
 */
const encryptSync = password => {
  const salt = bcrypt.genSaltSync(ROUNDS);
  return bcrypt.hashSync(password, salt);
};

/**
 * Compare plain text password to hashed password using bcrypt.
 *
 * @param {String} candidate Plain text password
 * @param {String} password Hashed password
 */
const compare = (candidate, password) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(candidate, password, (err, match) => (err ? reject(err) : resolve(match)));
  });

module.exports = {
  authToken,
  resetToken,
  encrypt,
  encryptSync,
  compare,
};
