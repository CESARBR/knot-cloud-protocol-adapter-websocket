class GetDevices {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id) {
    const { credentials } = this.sessionStore.get(id);
    if (!credentials) {
      this.handleError('Unauthorized', 401);
    }

    const devices = await this.cloud.getDevices(credentials);
    return { type: 'devices', data: devices };
  }

  handleError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

export default GetDevices;
