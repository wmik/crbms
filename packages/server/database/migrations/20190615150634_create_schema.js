exports.up = function(knex) {
  return knex.schema
    .createTable('accounts', function(table) {
      table.increments('account_id').primary();
      table
        .string('email', 50)
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
    })
    .createTable('clients', function(table) {
      table.increments('client_id').primary();
      table.string('first_name', 30).notNullable();
      table.string('last_name', 30).notNullable();
      table
        .string('email', 50)
        .unique()
        .notNullable();
      table
        .string('phone', 15)
        .unique()
        .notNullable();
      table
        .string('identification_number', 15)
        .unique()
        .notNullable();
      table
        .string('nationality', 30)
        .unique()
        .notNullable();
      table
        .enum('type', ['individual', 'organization'], {
          useNative: true,
          enumName: 'client_type'
        })
        .defaultTo('individual');
      table.jsonb('organization').defaultTo(null);
      table
        .integer('account_id')
        .unsigned()
        .notNullable()
        .index();
      table
        .foreign('account_id')
        .references('account_id')
        .inTable('accounts')
        .onDelete('CASCADE');
      table.timestamps(true, true);
    })
    .createTable('vehicles', function(table) {
      table.increments('vehicle_id').primary();
      table.string('make', 30).notNullable();
      table.string('model', 30).notNullable();
      table.string('license', 10).notNullable();
      table.float('fuel_capacity_max', 4).notNullable();
      table.integer('passengers').notNullable();
      table.jsonb('hire_pricing').notNullable();
      table
        .integer('account_id')
        .unsigned()
        .notNullable()
        .index();
      table
        .foreign('account_id')
        .references('account_id')
        .inTable('accounts')
        .onDelete('CASCADE');
      table.timestamps(true, true);
    })
    .createTable('jobs', function(table) {
      table.increments('job_id').primary();
      table.timestamp('start_date').notNullable();
      table.timestamp('end_date').notNullable();
      table
        .integer('client_id')
        .unsigned()
        .notNullable()
        .index();
      table
        .foreign('client_id')
        .references('client_id')
        .inTable('clients')
        .onDelete('CASCADE');
      table.specificType('vehicle_ids', 'INT[]').notNullable();
      table
        .integer('account_id')
        .unsigned()
        .notNullable()
        .index();
      table
        .foreign('account_id')
        .references('account_id')
        .inTable('accounts')
        .onDelete('CASCADE');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('jobs')
    .dropTableIfExists('clients')
    .dropTableIfExists('vehicles')
    .dropTableIfExists('accounts')
    .raw('DROP TYPE account_type; DROP TYPE client_type;');
};
