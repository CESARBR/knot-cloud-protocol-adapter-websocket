import Joi from 'joi';
import _ from 'lodash';

class UpdateSchema {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, data) {
    const session = this.sessionStore.get(id);
    const { schema } = data;

    if (!session) {
      this.throwError('Unauthorized', 401);
    }

    if (!await this.isSessionOwnerThing(session)) {
      this.throwError('Device has no schema', 400);
    }

    this.validateSchema(schema);
    await this.cloud.updateDevice(session.credentials, session.credentials.uuid, { schema });
    return { type: 'updated' };
  }

  throwError(message, code) {
    const error = Error(message);
    error.code = code;
    throw error;
  }

  async isSessionOwnerThing(session) {
    const device = await this.cloud.getDevice(session.credentials, session.credentials.uuid);
    return device.type === 'thing';
  }

  validateSchema(schema) {
    // Those validations is based in the knot protocol
    // Defined here: https://github.com/CESARBR/knot-protocol-source
    const { error } = Joi.validate(schema, Joi.array().items(Joi.object().keys({
      sensor_id: Joi.number().integer().min(0).max(0xff)
        .required(),
      type_id: Joi.alternatives().try(
        Joi.number().integer().min(0).max(0x15)
          .required(),
        Joi.number().integer().min(0xfff0).max(0xfff2)
          .required(),
        0xff10,
      ).required(),
      value_type: Joi.alternatives()
        .when('type_id', { is: [0, 0xfff0, 0xfff1, 0xfff2, 0xff10], then: Joi.number().integer().min(1).max(4) })
        .when('type_id', { is: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0x0A, 0x0B, 0x13, 0x15], then: 1 })
        .when('type_id', { is: [0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x14], then: 2 })
        .required(),
      unit: Joi.alternatives()
        .when('type_id', { is: [0, 0xfff0, 0xfff1, 0xfff2, 0xff10], then: 0 })
        .when('type_id', { is: 1, then: Joi.number().integer().min(1).max(3) })
        .when('type_id', { is: 2, then: Joi.number().integer().min(1).max(2) })
        .when('type_id', { is: 3, then: 1 })
        .when('type_id', { is: 4, then: Joi.number().integer().min(1).max(3) })
        .when('type_id', { is: 5, then: Joi.number().integer().min(1).max(3) })
        .when('type_id', { is: 6, then: 1 })
        .when('type_id', { is: 7, then: Joi.number().integer().min(1).max(3) })
        .when('type_id', { is: 8, then: Joi.number().integer().min(1).max(3) })
        .when('type_id', { is: 9, then: Joi.number().integer().min(1).max(4) })
        .when('type_id', { is: 0x0A, then: Joi.number().integer().min(1).max(3) })
        .when('type_id', { is: 0x0B, then: Joi.number().integer().min(1).max(4) })
        .when('type_id', { is: 0x0C, then: Joi.number().integer().min(1).max(2) })
        .when('type_id', { is: 0x0D, then: Joi.number().integer().min(1).max(4) })
        .when('type_id', { is: 0x0E, then: Joi.number().integer().min(1).max(3) })
        .when('type_id', { is: 0x0F, then: 1 })
        .when('type_id', { is: 0x10, then: 1 })
        .when('type_id', { is: 0x11, then: 1 })
        .when('type_id', { is: 0x12, then: 1 })
        .when('type_id', { is: 0x13, then: Joi.number().integer().min(1).max(4) })
        .when('type_id', { is: 0x14, then: Joi.number().integer().min(1).max(6) })
        .when('type_id', { is: 0x15, then: Joi.number().integer().min(1).max(6) })
        .required(),
      name: Joi.string().max(23).required(),
    }).required()).required(), { abortEarly: false });
    if (error) {
      throw Error(this.mapJoiError(error));
    }
  }

  mapJoiError(error) {
    const reasons = _.map(error.details, 'message');
    const formattedReasons = reasons.length > 1
      ? `\n${_.chain(reasons).map(reason => `- ${reason}`).join('\n').value()}`
      : reasons[0];
    return formattedReasons;
  }
}

export default UpdateSchema;
