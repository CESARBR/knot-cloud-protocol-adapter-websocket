import _ from 'lodash';
import isBase64 from 'is-base64';

class SetData {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      this.throwError('Unauthorized', 401);
    }

    const authDevice = await this.cloud.getDevice(credentials, credentials.uuid);
    if (authDevice.type !== 'app') {
      this.throwError('Only apps can send \'setData\'', 400);
    }

    const device = await this.cloud.getDevice(credentials, data.id, authDevice.knot.router);
    this.validateDataWithSchema(device, data.data);

    await this.cloud.sendMessage(credentials, data.id, 'command', { setData: data.data }, authDevice.knot.router);
    return { type: 'sent' };
  }

  validateDataWithSchema(device, dataList) {
    if (!device.schema) {
      this.throwError(`The thing ${device.id} has no schema for sensors`, 403);
    }

    dataList.forEach(data => this.validateValueType(device, data));
  }

  validateValueType(device, data) {
    const schema = device.schema.find(value => value.sensor_id === data.sensor_id);
    if (!schema) {
      this.throwError(`The thing ${device.id} has no schema for sensor id ${data.sensor_id}`, 403);
    }

    switch (schema.value_type) {
      case 1: // INTEGER
        if (!_.isInteger(data.value)) {
          this.throwError('Value is not integer', 403);
        }
        break;
      case 2: // FLOAT
        if (!_.isNumber(data.value)) {
          this.throwError('Value is not float', 403);
        }
        break;
      case 3: // BOOL
        if (!_.isBoolean(data.value)) {
          this.throwError('Value is not boolean', 403);
        }
        break;
      case 4: // RAW
        if (!isBase64(data.value)) {
          this.throwError('Value is not in base 64', 403);
        }
        break;
      default:
        break;
    }
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

export default SetData;
