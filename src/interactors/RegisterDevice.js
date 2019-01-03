import _ from 'lodash';

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
    return { type: 'registered', data: device };
  }

  async createDevice(session, properties) {
    const { type, name, active } = properties;
    if (!type) {
      this.throwError('\'type\' is required', 400);
    }

    let device;

    if (type === 'app') {
      device = await this.registerApp(session, { name });
    } else if (type === 'gateway') {
      device = await this.registerGateway(session, { name, active });
    } else {
      this.throwError('\'type\' should be \'gateway\' or \'app\'', 400);
    }

    return device;
  }

  verifyPermissions(authenticatedDevice) {
    if (authenticatedDevice.type !== 'knot:user') {
      this.throwError('Device owner isn\'t a user', 400);
    }
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
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
        active: options.active,
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
