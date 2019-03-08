import _ from 'lodash';
import flatten from 'flat';
import throwError from './throwError';

function mapDevice(device) {
  return _.pick(device, [
    'type',
    'metadata',
    'knot.active',
    'knot.gateways',
    'knot.id',
    'schema',
  ]);
}

function hasHiddenProperties(query) {
  const hiddenProperties = [
    'online',
    'knot.router',
    'meshblu',
    'uuid',
    'token',
  ];
  const flatQuery = flatten(query || {}); // { a: { b: true } } -> { 'a.b': true }
  return !_.chain(flatQuery)
    .keys() // -> ['a.b']
    .filter(key => _.some(
      hiddenProperties,
      // equals 'a' or start with 'a.'
      property => (key === property || _.startsWith(key, `${property}.`)),
    ))
    .isEmpty()
    .value();
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

    if (hasHiddenProperties(query)) {
      // act like it is filtering for a non-existent field
      return { type: 'devices', data: [] };
    }

    const devices = await this.cloud.getDevices(session.credentials, query);
    return { type: 'devices', data: filterDevices(devices, session.credentials.uuid) };
  }
}

export default GetDevices;
