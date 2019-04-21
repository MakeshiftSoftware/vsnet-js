const { encrypt, authToken } = require('vsnet-auth');
const { getSharedProperties } = require('vsnet-utils');
const db = require('./db');
const { DB_ERROR_UNIQUE_VIOLATION } = require('./constants');

module.exports = async (req, res, next) => {
  try {
    try {
      const hashedPassword = await encrypt(req.body.password);

      const newUser = await db('users')
        .insert({
          username: req.body.username,
          email: req.body.email,
          password: hashedPassword,
        })
        .returning(['id', 'username']);

      res.send({
        user: newUser,
        token: authToken(newUser),
      });
    } catch (e) {
      // Handle unique constraint violation.
      if (e.code === DB_ERROR_UNIQUE_VIOLATION) {
        const existingUsers = await db('users')
          .select('username', 'email')
          .where({ username: req.body.username })
          .orWhere({ email: req.body.email });

        if (existingUsers) {
          const fields = getSharedProperties(['email', 'username'], existingUsers, req.body);

          return res.status(409).send({
            error: fields.map(field => `That ${field} is already in use.`),
          });
        }
      } else {
        // Something else went wrong.
        throw e;
      }
    }
  } catch (e) {
    next(e);
  }
};
