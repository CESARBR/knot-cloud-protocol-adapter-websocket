class UpdateDevice {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, deviceId, properties) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      this.handleError('Unauthorized', 401);
    }

    await this.cloud.updateDevice(deviceId, properties, credentials);
    return { type: 'deviceUpdated' };
  }

  handleError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

export default UpdateDevice;
