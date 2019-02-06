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

    const authDevice = await this.cloud.getDevice(credentials, credentials.uuid);
    if (authDevice.type !== 'app') {
      this.throwError('Only apps can send \'getData\'', 400);
    }

    await this.cloud.sendMessage(credentials, data.id, 'command', { getData: data.sensorIds }, authDevice.knot.router);
    return { type: 'sent' };
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

export default GetData;
