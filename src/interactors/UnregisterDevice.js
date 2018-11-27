
class UnregisterDevice {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, data) {
    const session = this.sessionStore.get(id);
    const { id } = data;

    if (!session) {
      this.throwError('Unauthorized', 401);
    }

    await this.cloud.unregister(session.credentials, id);
    this.sessionStore.removeByUuid(id);
    return { type: 'unregistered' };
  }

  throwError(message, code) {
    const error = Error(message);
    error.code = code;
    throw error;
  }
}

export default UnregisterDevice;
