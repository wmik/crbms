import { SQLDataSource } from 'datasource-sql';

export class KnexDataSource extends SQLDataSource {
  constructor(knex, tableName) {
    super();
    this.knex = knex;
    this.tableName = tableName;
  }

  find(queryObject) {
    const query = this.knex.select().from(this.tableName);
    if (queryObject) {
      return query.where(queryObject);
    }
    return query;
  }

  insert(data) {
    if (this.validate(data)) {
      const query = this.knex.insert(data).into(this.tableName);
      return query;
    }
  }
  update(data, queryObject) {
    if (this.validate(data)) {
      const query = this.knex(this.tableName)
        .update(data)
        .where(queryObject);
      return query;
    }
  }
  delete(queryObject) {
    const query = this.knex
      .delete()
      .from(this.tableName)
      .where(queryObject);
    return query;
  }
  validate(data) {
    return true;
  }
}
