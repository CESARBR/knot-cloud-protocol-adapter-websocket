class GetData {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      this.throwError('Unauthorized', 401);
    }

    if (!await this.isSessionOwnerApp(credentials)) {
      this.throwError('Only apps can send \'getData\'', 400);
    }

    await this.cloud.sendMessageToDevice(credentials, data.id, 'command', { getData: data.sensorIds });
    return { type: 'sent' };
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  async isSessionOwnerApp(credentials) {
    const device = await this.cloud.getDevice(credentials, credentials.uuid);
    return device.type === 'app';
  }
}

export default GetData;
