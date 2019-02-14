import throwError from './util/throwError';
import validateValueType from './util/validateValueType';

class PublishData {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const session = this.sessionStore.get(requestId);

    if (!session) {
      throwError('Unauthorized', 401);
    }

    const device = await this.cloud.getDevice(session.credentials, session.credentials.uuid);

    if (!device.type === 'thing') {
      throwError('Only things can publish data', 400);
    }

    if (!device.schema) {
      throwError(`The thing ${device.id} has no schema for sensors`, 403);
    }

    validateValueType(device, data);

    await this.cloud.broadcastMessage(session.credentials, 'data', data);
    return { type: 'published' };
  }
}

export default PublishData;
