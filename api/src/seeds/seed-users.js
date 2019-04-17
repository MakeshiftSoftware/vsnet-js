const {
  crypto: { encryptSync },
} = require('vsnet-common');

exports.seed = knex =>
  knex('users')
    .del()
    .then(() =>
      knex('users').insert([
        {
          id: 1,
          email: 'admin@test.com',
          username: 'admin',
          password: encryptSync('123456'),
        },
        {
          id: 2,
          email: 'bob@test.com',
          username: 'bob',
          password: encryptSync('123456'),
        },
        {
          id: 3,
          email: 'alice@test.com',
          username: 'alice',
          password: encryptSync('123456'),
        },
      ]),
    );
