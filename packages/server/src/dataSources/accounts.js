import logger from 'debug';
import { compare, hash, genSalt } from 'bcryptjs';
import { KnexDataSource } from './interface';

const debug = logger('app:dataSources:accounts');

class Accounts extends KnexDataSource {
  async register(email, password) {
    try {
      const salt = await genSalt();
      const password_hash = await hash(password, salt);
      const [user = null] = await this.insert({
        email,
        password_hash
      }).returning(['account_id', 'email', 'type']);
      return user;
    } catch (err) {
      debug(err);
    }
  }
  async authenticate(email, password) {
    try {
      const [user = null] = await this.find({ email });
      let valid = false;
      if (user) {
        valid = await compare(password, user.password_hash);
        if (valid) {
          delete user.password_hash;
          return user;
        }
      }
      return null;
    } catch (err) {
      debug(err);
    }
  }
}

export default Accounts;
