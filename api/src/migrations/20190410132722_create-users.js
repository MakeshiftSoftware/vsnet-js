exports.up = knex =>
  knex.schema.createTable('users', table => {
    table.increments('id').primary();

    table
      .text('username')
      .notNullable()
      .unique();

    table
      .text('email')
      .notNullable()
      .unique();

    table.string('password').notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.string('reset_password_token').nullable();

    table.datetime('reset_password_token_expiry').nullable();
  });

exports.down = knex => knex.schema.dropTableIfExists('users');
