class RegisterDevice {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, properties) {
    const session = this.sessionStore.get(id);
    if (!session) {
      this.throwError('Unauthorized', 401);
    }

    const device = await this.createDevice(properties, session);
    const registeredDevice = await this.cloud.registerDevice(device);
    return { type: 'registered', data: registeredDevice };
  }

  async createDevice(properties, session) {
    const { name, type } = properties;
    if (!type) {
      this.throwError('\'type\' is required', 400);
    }

    let device;

    if (type === 'gateway' || type === 'app') {
      device = await this.createAppOrGatewayDevice(session, name, type);
    } else {
      this.throwError('\'type\' should be \'gateway\' or \'app\'', 400);
    }

    return device;
  }

  async createAppOrGatewayDevice(session, name, type) {
    if (!await this.isSessionOwnerUser(session)) {
      this.throwError('Device owner isn\'t a user', 400);
    }

    const device = this.createBasicDevice(name, type);
    device.meshblu = {
      version: '2.0.0',
      whitelists: this.generateWhitelists(session.credentials.uuid),
    };

    return device;
  }

  createBasicDevice(name, type) {
    return {
      type,
      metadata: {
        name: name || '',
      },
    };
  }

  async isSessionOwnerUser(session) {
    const deviceOwner = await this.cloud.getDevice(session.credentials, session.credentials.uuid);
    return deviceOwner.type === 'knot:user';
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  generateWhitelists(ownerUuid) {
    return {
      discover: {
        as: [{
          uuid: ownerUuid,
        }],
        view: [{
          uuid: ownerUuid,
        }],
      },
      configure: {
        as: [{
          uuid: ownerUuid,
        }],
        update: [{
          uuid: ownerUuid,
        }],
      },
    };
  }
}

export default RegisterDevice;
