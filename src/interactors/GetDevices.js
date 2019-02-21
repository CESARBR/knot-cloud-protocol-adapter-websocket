import _ from 'lodash';
import throwError from './throwError';

// TODO:
// Remove 'uuid' and use only 'knot.id'
function mapDevice(device) {
  return _.pick(device, [
    'type',
    'metadata',
    'knot.active',
    'knot.gateways',
    'knot.id',
    'uuid',
  ]);
}

function filterDevices(devices, self) {
  return devices
    .filter(device => !(device.type === 'router' || !device.type || device.uuid === self))
    .map(mapDevice);
}

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
    return { type: 'devices', data: filterDevices(devices, session.credentials.uuid) };
  }
}

export default GetDevices;
