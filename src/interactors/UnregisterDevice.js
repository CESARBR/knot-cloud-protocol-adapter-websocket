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

    const device = await this.cloud.getDevice(session.credentials, data.id);
    await this.cloud.unregister(session.credentials, data.id);
    this.sessionStore.removeByUuid(session.uuid);
    if (device.type === 'knot:thing') {
      await this.uuidAliasManager.remove(session.credentials, data.id);
    }

    return { type: 'unregistered' };
  }
}

export default UnregisterDevice;
