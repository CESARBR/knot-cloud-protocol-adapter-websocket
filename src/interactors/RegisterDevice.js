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
    await this.updateDevicesWhiteLists(registeredDevice, session);
    return { type: 'registered', data: registeredDevice };
  }

  async updateDevicesWhiteLists(device, session) {
    if (device.type === 'app') {
      await this.updateWhiteListByType(session, 'gateway', device.uuid);
      await this.updateWhiteListByType(session, 'thing', device.uuid);
    } else if (device.type === 'gateway') {
      await this.updateWhiteListByType(session, 'app', device.uuid);
      await this.updateWhiteListByType(session, 'thing', device.uuid);
    }
  }

  async updateWhiteListByType(session, type, toUuid) {
    const devices = await this.cloud.getDevices(session.credentials, { type });
    devices.forEach(async (device) => {
      await this.appendInWhiteList(device, toUuid);
      await this.cloud.updateDevice(device.uuid, { meshblu: device.meshblu }, session.credentials);
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
      this.throwError('\'type\' is required', 400);
    }

    let device;

    if (type === 'gateway' || type === 'app') {
      device = await this.createAppOrGatewayDevice(session, name, type);
    } else if (type === 'thing') {
      device = await this.createThingDevice(device, session);
    } else {
      this.throwError('\'type\' should be \'gateway\', \'app\' or \'thing\'', 400);
    }

    return device;
  }

  async createThingDevice(basicDevice, session) {
    const device = basicDevice;
    if (!(await this.sessionOwnerIsGateway(session)
          || await this.isSessionOwnerUser(session))) {
      this.generateError('Session unauthorized', 401);
    }
    const uuidList = await this.getGatewayWhiteList(session);
    uuidList.push({ uuid: session.credentials.uuid });

    device.meshblu = {
      version: '2.0.0',
      whitelists: this.generateWhitelists(uuidList),
    };

    return device;
  }

  async createAppOrGatewayDevice(session, name, type) {
    if (!await this.isSessionOwnerUser(session)) {
      this.throwError('Device owner isn\'t a user', 400);
    }

    const device = this.createBasicDevice(name, type);
    device.meshblu = {
      version: '2.0.0',
      whitelists: this.generateWhitelists([{ uuid: session.credentials.uuid }]),
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

  async getGatewayWhiteList(session) {
    const deviceOwner = await this.cloud.getDevice(session.credentials, session.credentials.uuid);
    const { whitelists } = deviceOwner.meshblu;
    if (whitelists) {
      return whitelists.discover.view;
    }
    throw this.generateError('Unathorized whitelists', 404);
  }

  async sessionOwnerIsGateway(session) {
    const deviceOwner = await this.cloud.getDevice(session.credentials, session.credentials.uuid);
    return deviceOwner.type === 'gateway';
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

  generateWhitelists(uuids) {
    return {
      discover: {
        as: uuids,
        view: uuids,
      },
      configure: {
        as: uuids,
        update: uuids,
      },
    };
  }
}

export default RegisterDevice;
