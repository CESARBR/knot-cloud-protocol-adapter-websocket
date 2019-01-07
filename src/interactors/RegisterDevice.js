import _ from 'lodash';
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

    const device = await this.createDevice(session, properties);
    await this.cloud.broadcastMessage(session.credentials, 'register', { device });
    return { type: 'registered', data: device };
  }

  async createDevice(session, properties) {
    const {
      id, type, name, active,
    } = properties;
    if (!type) {
      this.throwError('\'type\' is required', 400);
    }

    let device;

    if (type === 'app') {
      device = await this.registerApp(session, { name });
    } else if (type === 'gateway') {
      device = await this.registerGateway(session, { name, active });
    } else if (type === 'thing') {
      this.validateId(id);
      device = await this.registerThing(session, id, { name });
    } else {
      this.throwError('\'type\' should be \'gateway\', \'app\' or \'thing\'', 400);
    }

    return device;
  }

  verifyPermissions(authenticatedDevice) {
    if (authenticatedDevice.type !== 'knot:user' && authenticatedDevice.type !== 'gateway') {
      this.throwError('Device owner isn\'t a user or gateway', 400);
    }
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  mapJoiError(error) {
    return (`\n${_.chain(error.details).map(d => `- ${d.message}`).join('\n').value()}`);
  }

  validateId(id) {
    const { error } = Joi.validate(id, Joi.string().length(16).hex().required());
    if (error) {
      const joiError = this.mapJoiError(error);
      this.throwError(`ID '${id}' invalid: ${joiError}`, 400);
    }
  }

  async registerApp(session, options) {
    const user = await this.cloud.getDevice(session.credentials, session.credentials.uuid);
    this.verifyPermissions(user);

    const app = await this.createApp(user, options);
    await this.connectRouterToApp(session, user, app);

    return app;
  }

  async registerGateway(session, options) {
    const user = await this.cloud.getDevice(session.credentials, session.credentials.uuid);
    this.verifyPermissions(user);

    const gateway = await this.createGateway(user, options);
    await this.connectRouterToGateway(session, user, gateway);

    return gateway;
  }

  async registerThing(session, id, options) {
    const device = await this.cloud.getDevice(session.credentials, session.credentials.uuid);
    this.verifyPermissions(device);

    const thing = await this.createThing(device, id, options);
    await this.connectRouterToThing(session, device, thing);

    return thing;
  }

  async createApp(user, options) {
    return this.cloud.registerDevice({
      type: 'app',
      metadata: {
        name: options.name,
      },
      knot: {
        router: user.knot.router,
      },
      meshblu: {
        version: '2.0.0',
        whitelists: {
          discover: {
            view: [{ uuid: user.uuid }],
          },
          configure: {
            update: [{ uuid: user.uuid }],
          },
        },
      },
    });
  }

  async createGateway(user, options) {
    return this.cloud.registerDevice({
      type: 'gateway',
      metadata: {
        name: options.name,
      },
      knot: {
        user: user.uuid,
        router: user.knot.router,
        active: options.active || false,
      },
      meshblu: {
        version: '2.0.0',
        whitelists: {
          discover: {
            view: [{ uuid: user.uuid }],
          },
          configure: {
            update: [{ uuid: user.uuid }],
          },
        },
      },
    });
  }

  async createThing(device, id, options) {
    const params = {
      type: 'thing',
      id,
      metadata: {
        name: options.name,
      },
      knot: {
        gateways: [],
      },
      meshblu: {
        version: '2.0.0',
        whitelists: {
          discover: {
            view: [
              { uuid: device.knot.router },
              { uuid: device.uuid },
            ],
          },
          configure: {
            update: [
              { uuid: device.knot.router },
              { uuid: device.uuid },
            ],
            sent: [{ uuid: device.knot.router }],
          },
          broadcast: {
            sent: [{ uuid: device.knot.router }],
          },
          message: {
            from: [{ uuid: device.knot.router }],
          },
          unregister: {
            sent: [{ uuid: device.knot.router }],
          },
        },
      },
    };

    if (device.type === 'gateway') {
      params.knot.gateways.push(device.uuid);
      params.meshblu.whitelists.discover.view.push({ uuid: device.knot.user });
      params.meshblu.whitelists.configure.update.push({ uuid: device.knot.user });
    }

    return this.cloud.registerDevice(params);
  }

  async connectRouterToApp(session, user, app) {
    await this.givePermission(session, user.knot.router, app.uuid, 'broadcast.received');
    await this.givePermission(session, user.knot.router, app.uuid, 'unregister.received');
    await this.givePermission(session, user.knot.router, app.uuid, 'configure.received');

    await this.subscribeOwn(session, app.uuid, 'broadcast.received');
    await this.subscribeOwn(session, app.uuid, 'unregister.received');
    await this.subscribe(session, user.knot.router, app.uuid, 'broadcast.received');
    await this.subscribe(session, user.knot.router, app.uuid, 'unregister.received');

    await this.givePermission(session, user.knot.router, app.uuid, 'message.as');
    await this.givePermission(session, user.knot.router, app.uuid, 'discover.as');
    await this.givePermission(session, user.knot.router, app.uuid, 'configure.as');
  }

  async connectRouterToGateway(session, user, gateway) {
    await this.givePermission(session, user.knot.router, gateway.uuid, 'configure.update');
  }

  async connectRouterToThing(session, device, thing) {
    await this.subscribeOwn({ credentials: { uuid: thing.uuid, token: thing.token } }, thing.uuid, 'message.received');
    await this.subscribe(session, thing.uuid, device.knot.router, 'broadcast.sent');
    await this.subscribe(session, thing.uuid, device.knot.router, 'unregister.sent');
  }

  async subscribe(session, from, to, type) {
    await this.cloud.createSubscription(session.credentials, {
      subscriberUuid: to,
      emitterUuid: from,
      type,
    });
  }

  async subscribeOwn(session, uuid, type) {
    await this.subscribe(session, uuid, uuid, type);
  }

  async givePermission(session, from, to, type) {
    const device = await this.cloud.getDevice(session.credentials, from);
    this.pushToWhitelist(device, type, to);
    await this.cloud.updateDevice(session.credentials, device.uuid, { meshblu: device.meshblu });
  }

  pushToWhitelist(device, type, uuid) {
    _.defaultsDeep(device, { meshblu: { whitelists: this.pathToObject(type) } });
    _.get(device, `meshblu.whitelists.${type}`).push({ uuid });
  }

  pathToObject(path) {
    /* eslint-disable no-multi-spaces */
    return _.chain(path)                                // 'broadcast.received'
      .toPath()                                         // ['broadcast', 'received']
      .reverse()                                        // ['received', 'broadcast']
      .reduce((acc, step) => _.set({}, step, acc), [])  // { broadcast: { received: [] }}
      .value();
    /* eslint-enable no-multi-spaces */
  }
}

export default RegisterDevice;
