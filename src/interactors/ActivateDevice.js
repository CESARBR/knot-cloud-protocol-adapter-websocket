class ActivateDevice {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      this.throwError('Unauthorized', 401);
    }

    await this.cloud.updateDevice(credentials, data.uuid, { 'knot.active': true });
    return { type: 'activated' };
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

export default ActivateDevice;
