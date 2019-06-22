import logger from 'debug';
import { KnexDataSource } from './interface';
import { map, transformKeysToSnakeCase } from '../util';

const debug = logger('app:dataSources:clients');

class Clients extends KnexDataSource {
  async findAll(queryObject, pagination) {
    try {
      const clients = await this.find(queryObject)
        .limit(pagination.limit)
        .offset(pagination.offset);
      return clients;
    } catch (err) {
      debug(err);
    }
  }
  async insertOne(data) {
    try {
      const [client = null] = await this.insert(
        map(data, transformKeysToSnakeCase)
      ).returning('*');
      return client;
    } catch (err) {
      debug(err);
    }
  }
}

export default Clients;
