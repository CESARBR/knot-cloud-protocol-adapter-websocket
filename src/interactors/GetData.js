import throwError from './throwError';

class GetData {
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
    if (authDevice.type !== 'app') {
      throwError('Only apps can send \'getData\'', 400);
    }

    await this.cloud.sendMessage(credentials, data.id, 'command', { name: 'getData', args: data.sensorIds }, authDevice.knot.router);
    return { type: 'sent' };
  }
}

export default GetData;
