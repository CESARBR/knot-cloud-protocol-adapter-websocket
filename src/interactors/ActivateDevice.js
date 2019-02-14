import throwError from './throwError';

class ActivateDevice {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      throwError('Unauthorized', 401);
    }

    await this.cloud.updateDevice(credentials, data.id, { 'knot.active': true });
    return { type: 'activated' };
  }
}

export default ActivateDevice;
