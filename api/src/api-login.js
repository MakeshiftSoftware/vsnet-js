const {
  crypto: { compare, authToken },
  errors: { UnauthorizedError },
} = require('vsnet-common');
const db = require('./db');

module.exports = async (req, res, next) => {
  try {
    const user = await db('users')
      .select('id', 'username', 'password')
      .where({ username: req.body.username })
      .first();

    if (!user) {
      return new UnauthorizedError();
    }

    const match = await compare(req.body.password, user.password);

    if (!match) {
      return new UnauthorizedError();
    }

    delete user.password;

    res.send({
      user,
      token: authToken(user),
    });
  } catch (e) {
    next(e);
  }
};
