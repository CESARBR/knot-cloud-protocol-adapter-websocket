class RegisterDevice {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, props) {
    const device = props;
    const { credentials } = this.sessionStore.get(id);

    if (!credentials) {
      this.handleError('Unauthorized', 401);
    }

    if (device.type === 'gateway' || device.type === 'app') {
      const deviceOwner = await this.cloud.getDevice(device.owner, credentials);
      if (deviceOwner.type !== 'knot:user') {
        this.handleError('Device owner isn\'t a user');
      }

      device.meshblu = {
        version: '2.0.0',
        whitelists: this.generateWhitelists(device.owner),
      };
    }

    const deviceRegistered = await this.cloud.registerDevice(device);
    return { type: 'deviceRegistered', data: deviceRegistered };
  }

  handleError(message, code) {
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
