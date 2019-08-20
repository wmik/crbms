import logger from 'debug';
import { KnexDataSource } from './interface';
import { transformKeysToSnakeCase, map } from '../util';

const debug = logger('app:dataSources:vehicles');

class Jobs extends KnexDataSource {
  async findAll(queryObject, pagination) {
    try {
      const jobs = await this.find(queryObject)
        .limit(pagination.limit)
        .offset(pagination.offset);
      return jobs;
    } catch (err) {
      debug(err);
    }
  }
  async insertOne(data) {
    try {
      const [job = null] = await this.insert(
        map(data, transformKeysToSnakeCase)
      ).returning('*');
      return job;
    } catch (err) {
      debug(err);
    }
  }
}

export default Jobs;
