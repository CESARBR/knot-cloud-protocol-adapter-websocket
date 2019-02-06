import { promisify } from 'util';

class Cloud {
  constructor(requester, messenger, uuidAliasManager) {
    this.requester = requester;
    this.messenger = messenger;
    this.uuidAliasManager = uuidAliasManager;
  }

  close() {
    this.messenger.close();
  }

  async authenticate(credentials) {
    const request = {
      metadata: {
        auth: credentials,
        jobType: 'Authenticate',
      },
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 204);

    const connectAsync = promisify(this.messenger.connect.bind(this.messenger));
    await connectAsync(credentials);
  }

  async registerDevice(device) {
    const request = {
      metadata: {
        jobType: 'RegisterDevice',
      },
      data: device,
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 201);
    return JSON.parse(response.rawData);
  }

  async updateDevice(credentials, id, properties) {
    const device = await this.getDevice(credentials, credentials.uuid);
    const uuid = await this.uuidAliasManager.resolve(id);
    const request = {
      metadata: {
        jobType: 'FindAndUpdateDevice',
        auth: credentials,
        toUuid: uuid,
        fromUuid: device.type === 'app' ? device.knot.router : credentials.uuid,
      },
      data: {
        $set: properties,
      },
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 200);
  }

  async getDevice(credentials, id) {
    const uuid = await this.uuidAliasManager.resolve(id);
    const request = {
      metadata: {
        jobType: 'GetDevice',
        auth: credentials,
        toUuid: uuid,
      },
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 200);
    return JSON.parse(response.rawData);
  }

  async getDevices(credentials, query) {
    const device = await this.getDevice(credentials, credentials.uuid);
    const request = {
      metadata: {
        jobType: 'SearchDevices',
        auth: credentials,
        fromUuid: device.type === 'app' ? device.knot.router : credentials.uuid,
      },
      data: query,
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 200);
    return JSON.parse(response.rawData);
  }

  async unregister(credentials, id) {
    const uuid = await this.uuidAliasManager.resolve(id);
    const request = {
      metadata: {
        jobType: 'UnregisterDevice',
        toUuid: uuid,
        auth: credentials,
      },
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 204);
    return JSON.parse(response.rawData);
  }

  async createSessionToken(credentials, id) {
    const uuid = await this.uuidAliasManager.resolve(id);
    const request = {
      metadata: {
        jobType: 'CreateSessionToken',
        toUuid: uuid,
        fromUuid: credentials.uuid,
        auth: credentials,
      },
      data: {},
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 201);
    return JSON.parse(response.rawData);
  }

  async sendMessageToDevice(credentials, id, topic, payload) {
    const uuid = await this.uuidAliasManager.resolve(id);
    const device = await this.getDevice(credentials, credentials.uuid);
    const sender = device.type === 'app' ? device.knot.router : credentials.uuid;
    const request = {
      metadata: {
        jobType: 'SendMessage',
        auth: {
          uuid: credentials.uuid,
          token: credentials.token,
          as: sender,
        },
        fromUuid: sender,
      },
      data: {
        devices: uuid,
        topic,
        payload,
      },
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 204);
    return JSON.parse(response.rawData);
  }

  async broadcastMessage(credentials, topic, payload) {
    const request = {
      metadata: {
        jobType: 'SendMessage',
        auth: credentials,
      },
      data: {
        devices: ['*'],
        topic,
        payload,
      },
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 204);
    return JSON.parse(response.rawData);
  }

  async createSubscription(credentials, properties) {
    const request = {
      metadata: {
        jobType: 'CreateSubscription',
        auth: credentials,
        toUuid: properties.subscriberUuid,
      },
      data: properties,
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 201);
  }

  async sendRequest(request) {
    let response;

    try {
      response = await this.send(request);
    } catch (error) {
      this.throwError('Bad Gateway', 502);
    }

    return response;
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  checkResponseHasError(response, successCode) {
    if (!response) {
      this.throwError('Gateway Timeout', 504);
    }

    if (response.metadata.code !== successCode) {
      this.throwError(response.metadata.status, response.metadata.code);
    }
  }

  async send(request) {
    return new Promise((resolve, reject) => {
      this.requester.do(request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  on(type, listener) {
    this.messenger.on(type, (message) => {
      const parsedMessage = {
        metadata: message.metadata,
      };
      try {
        parsedMessage.data = JSON.parse(message.rawData);
      } catch (e) {
        parsedMessage.rawData = message.rawData;
      }
      listener(parsedMessage);
    });
  }
}

export default Cloud;
