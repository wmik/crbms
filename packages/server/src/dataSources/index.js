import Knex from 'knex';
import Accounts from './accounts';
import Clients from './clients';
import Vehicles from './vehicles';
import Jobs from './jobs';
import MailgunAPI from './mailer';
import knexConfig from '../../knexfile';

const knex = Knex(knexConfig[process.env.NODE_ENV]);

function dataSources() {
  return {
    accounts: new Accounts(knex, 'accounts'),
    clients: new Clients(knex, 'clients'),
    vehicles: new Vehicles(knex, 'vehicles'),
    jobs: new Jobs(knex, 'jobs'),
    mailer: new MailgunAPI()
  };
}

export default dataSources;
