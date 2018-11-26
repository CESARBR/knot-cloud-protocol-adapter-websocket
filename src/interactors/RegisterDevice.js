class RegisterDevice {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, properties) {
    const session = this.sessionStore.get(id);
    if (!session) {
      this.generateError('Unauthorized', 401);
    }

    const device = await this.createDevice(properties, session);
    const deviceRegistered = await this.cloud.registerDevice(device);
    return { type: 'deviceRegistered', data: deviceRegistered };
  }

  async createDevice(properties, session) {
    const { name, type } = properties;
    if (!type) {
      this.generateError('Type property is required', 500);
    }

    let device = this.createBasicDevice(name, type);

    if (type === 'gateway' || type === 'app') {
      device = this.createAppOrGatewayDevice(device, session);
    }

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

  async createAppOrGatewayDevice(basicDevice, session) {
    const device = basicDevice;
    if (!await this.sessionOwnerIsUser(session)) {
      this.generateError('Device owner isn\'t a user', 500);
    }

    device.meshblu = {
      version: '2.0.0',
      whitelists: this.generateWhitelists(session.credentials.uuid),
    };

    return device;
  }

  async sessionOwnerIsUser(session) {
    const deviceOwner = await this.cloud.getDevice(session.credentials.uuid, session.credentials);
    return deviceOwner.type === 'knot:user';
  }

  generateError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  generateWhitelists(uuid) {
    return {
      discover: {
        as: [{
          uuid,
        }],
        view: [{
          uuid,
        }],
      },
      configure: {
        as: [{
          uuid,
        }],
        update: [{
          uuid,
        }],
      },
    };
  }
}

export default RegisterDevice;
