class GetDevices {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, query) {
    const session = this.sessionStore.get(id);
    if (!session) {
      this.generateError('Unauthorized', 401);
    }

    const devices = await this.cloud.getDevices(session.credentials, query);
    return { type: 'devices', data: devices };
  }

  generateError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

export default GetDevices;
