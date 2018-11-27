import _ from 'lodash';

class UnregisterDevice {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, data) {
    const session = this.sessionStore.get(id);
    let sessionId;

    if (!session) {
      this.generateError('Unauthorized', 401);
    }

    try {
      await this.cloud.unregister(session.credentials, data);
      sessionId = this.getSessionbyUuid(data.toUuid);
      this.sessionStore.remove(sessionId);
    } catch (error) {
      throw error;
    }
    return { type: 'DeviceUnregistered' };
  }

  generateError(message, code) {
    const error = Error(message);
    error.code = code;
    throw error;
  }

  getSessionbyUuid(uuid) {
    return _.findKey(this.sessionStore.sessions, i => i.credentials.uuid === uuid);
  }
}

export default UnregisterDevice;
