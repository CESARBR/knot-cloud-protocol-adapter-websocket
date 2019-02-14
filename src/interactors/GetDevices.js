import throwError from './util/throwError';

class GetDevices {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, query) {
    const session = this.sessionStore.get(requestId);
    if (!session) {
      throwError('Unauthorized', 401);
    }

    const devices = await this.cloud.getDevices(session.credentials, query);
    return { type: 'devices', data: devices };
  }
}

export default GetDevices;
