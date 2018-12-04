import Joi from 'joi';

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
    await this.updateDevicesWhitelists(registeredDevice, session);
    return { type: 'registered', data: registeredDevice };
  }

  async updateDevicesWhitelists(device, session) {
    if (device.type === 'app') {
      await this.updateWhitelistByType(session, 'gateway', device.uuid);
      await this.updateWhitelistByType(session, 'thing', device.uuid);
    } else if (device.type === 'gateway') {
      await this.updateWhitelistByType(session, 'app', device.uuid);
      await this.updateWhitelistByType(session, 'thing', device.uuid);
    }
  }

  async updateWhitelistByType(session, type, toUuid) {
    const devices = await this.cloud.getDevices(session.credentials, { type });
    const updatePromises = devices.map(async (device) => {
      const { meshblu } = device;
      await this.appendToWhitelist(device, toUuid);
      await this.cloud.updateDevice(session.credentials, device.uuid, { meshblu });
    });
    await Promise.all(updatePromises);
  }

  async appendToWhitelist(device, uuid) {
    const { as, view } = device.meshblu.whitelists.discover;
    const { as: asConfig, update } = device.meshblu.whitelists.configure;
    as.push({ uuid });
    view.push({ uuid });
    asConfig.push({ uuid });
    update.push({ uuid });
  }

  async createDevice(properties, session) {
    const { name, type, id } = properties;
    let device;
    if (!type) {
      this.throwError('\'type\' is required', 400);
    }

    if (type === 'gateway' || type === 'app') {
      device = await this.createAppOrGatewayDevice(session, name, type);
    } else if (type === 'thing') {
      this.validateId(id);
      device = await this.createThingDevice(session, name, type, id);
    } else {
      this.throwError('\'type\' should be \'gateway\', \'app\' or \'thing\'', 400);
    }

    return device;
  }

  async createThingDevice(session, name, type, id) {
    const device = this.createBasicDevice(name, type, id);
    if (!(await this.sessionOwnerIsGateway(session)
          || await this.isSessionOwnerUser(session))) {
      this.generateError('Session unauthorized', 401);
    }
    const uuidList = await this.getGatewayWhitelist(session);
    uuidList.push({ uuid: session.credentials.uuid });

    device.meshblu = {
      version: '2.0.0',
      whitelists: this.generateWhitelists(uuidList),
    };

    return device;
  }

  validateId(id) {
    const { error } = Joi.validate(id, Joi.string().length(16).hex().required());
    if (error) {
      this.throwError(error, 400);
    }
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

  createBasicDevice(name, type, id) {
    return {
      type,
      id,
      metadata: {
        name: name || '',
      },
    };
  }

  async getGatewayWhitelist(session) {
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
