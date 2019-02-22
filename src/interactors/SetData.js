import throwError from './throwError';
import validateValueType from './validateValueType';

class SetData {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      throwError('Unauthorized', 401);
    }

    const authDevice = await this.cloud.getDevice(credentials, credentials.uuid);
    if (authDevice.type !== 'knot:app') {
      throwError('Only apps can send \'setData\'', 400);
    }

    const device = await this.cloud.getDevice(credentials, data.id, authDevice.knot.router);
    this.validateDataWithSchema(device, data.data);

    await this.cloud.sendMessage(credentials, data.id, 'command', { name: 'setData', args: data.data }, authDevice.knot.router);
    return { type: 'sent' };
  }

  validateDataWithSchema(device, dataList) {
    if (!device.schema) {
      throwError(`The thing ${device.id} has no schema for sensors`, 403);
    }

    dataList.forEach(data => validateValueType(device, data));
  }
}

export default SetData;
