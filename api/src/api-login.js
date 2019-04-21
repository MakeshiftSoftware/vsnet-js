const { compare, authToken } = require('vsnet-auth');
const db = require('./db');

module.exports = async (req, res, next) => {
  try {
    const user = await db('users')
      .select('id', 'username', 'password')
      .where({ username: req.body.username })
      .first();

    if (!user) {
      return res.sendStatus(401);
    }

    const match = await compare(req.body.password, user.password);

    if (!match) {
      return res.sendStatus(401);
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
