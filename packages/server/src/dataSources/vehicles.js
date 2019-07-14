import logger from 'debug';
import { KnexDataSource } from './interface';
import { transformKeysToSnakeCase, map } from '../util';

const debug = logger('app:dataSources:vehicles');

class Vehicles extends KnexDataSource {
  async findAll(queryObject, pagination) {
    try {
      const vehicles = await this.find(queryObject)
        .limit(pagination.limit)
        .offset(pagination.offset);
      return vehicles;
    } catch (err) {
      debug(err);
    }
  }
  async insertOne(data) {
    try {
      const [vehicle = null] = await this.insert(
        map(data, transformKeysToSnakeCase)
      ).returning('*');
      return vehicle;
    } catch (err) {
      debug(err);
    }
  }
  async findMany(queryObject, pagination, values, key) {
    try {
      const vehicles = await this.find(queryObject)
        .whereIn(key, values)
        .limit(pagination.limit)
        .offset(pagination.offset);
      return vehicles;
    } catch (err) {
      debug(err);
    }
  }
}

export default Vehicles;
