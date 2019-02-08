import _ from 'lodash';
import isBase64 from 'is-base64';

class PublishData {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const session = this.sessionStore.get(requestId);

    if (!session) {
      this.throwError('Unauthorized', 401);
    }

    const device = await this.cloud.getDevice(session.credentials, session.credentials.uuid);

    if (!device.type === 'thing') {
      this.throwError('Only things can publish data', 400);
    }

    if (!device.schema) {
      this.throwError(`The thing ${device.id} has no schema for sensors`, 403);
    }

    this.validateValueType(device, data);

    await this.cloud.broadcastMessage(session.credentials, 'data', data);
    return { type: 'published' };
  }

  validateValueType(device, data) {
    const schema = device.schema.find(value => value.sensorId === data.sensorId);

    if (!schema) {
      this.throwError(`The thing ${device.id} has no schema for sensor id ${data.sensorId}`, 403);
    }

    switch (schema.valueType) {
      case 1:
        if (!_.isInteger(data.value)) {
          this.throwError('Value is not integer', 403);
        }
        break;
      case 2:
        if (!_.isNumber(data.value) || _.isNaN(data.value)) {
          this.throwError('Value is not float', 403);
        }
        break;
      case 3:
        if (!_.isBoolean(data.value)) {
          this.throwError('Value is not boolean', 403);
        }
        break;
      case 4:
        if (!isBase64(data.value)) {
          this.throwError('Value is not in base 64', 403);
        }
        break;
      default:
        break;
    }
  }

  throwError(message, code) {
    const error = Error(message);
    error.code = code;
    throw error;
  }
}

export default PublishData;
