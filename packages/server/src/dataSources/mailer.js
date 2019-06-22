import logger from 'debug';
import { RESTDataSource } from 'apollo-datasource-rest';

const debug = logger('app:dataSources:mailer');

class MailgunAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = `https://api.mailgun.net`;
  }
  willSendRequest(request) {
    request.headers.set(
      'Authorization',
      `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString(
        'base64'
      )}`
    );
  }
  async validateEmail(address) {
    try {
      return await this.get('/v4/address/validate', { address });
    } catch (err) {
      debug(err);
    }
  }
  async sendEmail(params) {
    try {
      return await this.post(
        `/v3/${process.env.MAILGUN_DOMAIN}/messages`,
        null,
        { params }
      );
    } catch (err) {
      debug(err);
    }
  }
}

export default MailgunAPI;
