const {
  errors: { UniqueViolationError },
  utils: { getSharedProperties },
  crypto: { encrypt, authToken },
} = require('vsnet-common');
const db = require('./db');
const { DB_ERROR_UNIQUE_VIOLATION } = require('./constants');

module.exports = async (req, res, next) => {
  try {
    const hashedPassword = await encrypt(req.body.password);

    try {
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
      // handle unique constraint violation.
      if (e.code === DB_ERROR_UNIQUE_VIOLATION) {
        const existingUsers = await db('users')
          .select('username', 'email')
          .where({ username: req.body.username })
          .orWhere({ email: req.body.email });

        if (existingUsers) {
          const fields = getSharedProperties(['email', 'username'], existingUsers, req.body);
          throw new UniqueViolationError(fields);
        }
      } else {
        throw e;
      }
    }
  } catch (e) {
    next(e);
  }
};
