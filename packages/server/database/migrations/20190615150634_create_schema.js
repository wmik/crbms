exports.up = function(knex) {
  return knex.schema.createTable('accounts', function(table) {
    table.increments('account_id').primary();
    table
      .string('email', 30)
      .unique()
      .notNullable();
    table.text('password_hash').notNullable();
    table
      .enum('type', ['user', 'admin'], {
        useNative: true,
        enumName: 'account_type'
      })
      .defaultTo('user');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('accounts');
};
