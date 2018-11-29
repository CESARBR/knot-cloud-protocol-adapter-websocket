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
    } else if (type === 'thing') {
      device = this.createThingDevice(device, session);
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

  async createThingDevice(basicDevice, session) {
    const device = basicDevice;
    if (!await this.sessionOwnerIsGateway(session)) {
      this.generateError('Device owner isn\'t a gateway');
    }
    const uuidList = await this.getGatewayWhiteList(session);
    uuidList.push({ uuid: session.credentials.uuid });

    device.meshblu = {
      version: '2.0.0',
      whitelists: this.generateWhitelists(uuidList),
    };

    return device;
  }

  async createAppOrGatewayDevice(basicDevice, session) {
    const device = basicDevice;
    if (!await this.sessionOwnerIsUser(session)) {
      this.generateError('Device owner isn\'t a user', 500);
    }

    device.meshblu = {
      version: '2.0.0',
      whitelists: this.generateWhitelists([{ uuid: session.credentials.uuid }]),
    };

    return device;
  }

  async getGatewayWhiteList(session) {
    const deviceOwner = await this.cloud.getDevice(session.credentials.uuid, session.credentials);
    const { whitelists } = deviceOwner.meshblu;
    if (whitelists) {
      return whitelists.discover.view;
    }
    throw this.generateError('Unathorized whitelists', 404);
  }

  async sessionOwnerIsGateway(session) {
    const deviceOwner = await this.cloud.getDevice(session.credentials.uuid, session.credentials);
    return deviceOwner.type === 'gateway';
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

  generateWhitelists(uuids) {
    return {
      discover: {
        as:
          uuids,
        view:
          uuids,
      },
      configure: {
        as:
          uuids,
        update:
          uuids,
      },
    };
  }
}

export default RegisterDevice;
