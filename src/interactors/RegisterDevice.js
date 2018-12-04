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
    await this.updateGatewaysAndThings(deviceRegistered, session);
    return { type: 'deviceRegistered', data: deviceRegistered };
  }

  async updateGatewaysAndThings(device, session) {
    if (device.type === 'app') {
      await this.updateWhiteListByType(session, 'gateway', device.uuid);
      await this.updateWhiteListByType(session, 'thing', device.uuid);
    }
    return;
  }

  async updateWhiteListByType(session, type, toUuid) {
    const devices = await this.cloud.getDevices(session.credentials, { type });
    devices.forEach(async device => {
      await this.appendInWhiteList(device, toUuid);
      await this.cloud.updateDevice(device.uuid, {meshblu: device.meshblu}, session.credentials)
    });
  }

  async appendInWhiteList(device, uuid) {
    const { as, view } = device.meshblu.whitelists.discover;
    const { as: asConfig, update } = device.meshblu.whitelists.configure;
    as.push({ uuid });
    view.push({ uuid });
    asConfig.push({ uuid });
    update.push({ uuid });
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
