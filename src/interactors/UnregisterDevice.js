import throwError from './throwError';

class UnregisterDevice {
  constructor(sessionStore, cloud, uuidAliasManager) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
    this.uuidAliasManager = uuidAliasManager;
  }

  async execute(requestId, data) {
    const session = this.sessionStore.get(requestId);
    if (!session) {
      throwError('Unauthorized', 401);
    }

    await this.cloud.unregister(session.credentials, data.id);
    this.sessionStore.removeByUuid(await this.uuidAliasManager.resolve(data.id));
    await this.uuidAliasManager.remove(session.credentials, data.id);

    return { type: 'unregistered' };
  }
}

export default UnregisterDevice;
