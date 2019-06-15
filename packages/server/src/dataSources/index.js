import Knex from 'knex';
import Accounts from './accounts';
import knexConfig from '../../knexfile';

const knex = Knex(knexConfig[process.env.NODE_ENV]);

function dataSources() {
  return { accounts: new Accounts(knex, 'accounts') };
}

export default dataSources;
