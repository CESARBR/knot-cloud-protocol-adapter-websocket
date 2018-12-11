
class UnregisterDevice {
  constructor(sessionStore, cloud, uuidAliasManager) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
    this.uuidAliasManager = uuidAliasManager;
  }

  async execute(requestId, data) {
    const session = this.sessionStore.get(requestId);
    const { id } = data;

    if (!session) {
      this.throwError('Unauthorized', 401);
    }

    await this.cloud.unregister(session.credentials, id);
    await this.uuidAliasManager.remove(session.credentials, id);
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
