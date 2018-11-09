import config from 'config';
import Joi from 'joi';
import _ from 'lodash';

import Settings from 'data/Settings';

const serverSchema = Joi.object().keys({
  port: Joi.number().port(),
});
const levels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
const loggerSchema = Joi.object().keys({
  level: Joi.string().valid(levels).required(),
});

class SettingsFactory {
  create() {
    const server = this.loadServerSettings();
    const logger = this.loadLoggerSettings();
    return new Settings(server, logger);
  }

  loadServerSettings() {
    const server = config.get('server');
    this.validate('server', server, serverSchema);
    return server;
  }

  loadLoggerSettings() {
    const logger = config.get('logger');
    this.validate('logger', logger, loggerSchema);
    return logger;
  }

  validate(propertyName, propertyValue, schema) {
    const { error } = Joi.validate(propertyValue, schema, { abortEarly: false });
    if (error) {
      throw this.mapJoiError(propertyName, error);
    }
  }

  mapJoiError(propertyName, error) {
    const reasons = _.map(error.details, 'message');
    const formattedReasons = reasons.length > 1
      ? `\n${_.chain(reasons).map(reason => `- ${reason}`).join('\n').value()}`
      : reasons[0];
    return new Error(`Invalid "${propertyName}" property: ${formattedReasons}`);
  }
}

export default SettingsFactory;
