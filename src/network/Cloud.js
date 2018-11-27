class Cloud {
  constructor(requester, messenger) {
    this.requester = requester;
    this.messenger = messenger;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.messenger.connect((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
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

  async updateDevice(uuid, properties, credentials) {
    const request = {
      metadata: {
        jobType: 'FindAndUpdateDevice',
        auth: credentials,
        toUuid: uuid,
      },
      data: {
        $set: properties,
      },
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 200);
  }

  async getDevice(uuid, credentials) {
    const request = {
      metadata: {
        jobType: 'GetDevice',
        auth: credentials,
        toUuid: uuid,
        fromUuid: credentials.uuid,
      },
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 200);
    return JSON.parse(response.rawData);
  }

  async getDevices(credentials, query) {
    const request = {
      metadata: {
        jobType: 'SearchDevices',
        auth: credentials,
        fromUuid: credentials.uuid,
      },
      data: query,
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 200);
    return JSON.parse(response.rawData);
  }

  async unregister(credentials, data) {
    const request = {
      metadata: {
        jobType: 'UnregisterDevice',
        toUuid: data.uuid,
        auth: credentials,
      },
      data,
    };

    const response = await this.sendRequest(request);
    this.checkResponseHasError(response, 200);
    return JSON.parse(response.rawData);
  }

  async sendRequest(request) {
    let response;

    try {
      response = await this.send(request);
    } catch (error) {
      this.generateError('Bad Gateway', 502);
    }

    return response;
  }

  generateError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  checkResponseHasError(response, successCode) {
    if (!response) {
      this.generateError('Gateway Timeout', 504);
    }

    if (response.metadata.code !== successCode) {
      this.generateError(response.metadata.status, response.metadata.code);
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

  async subscribe(options) {
    return new Promise((resolve, reject) => {
      this.messenger.subscribe(options, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  on(type, listener) {
    this.messenger.on(type, listener);
  }
}

export default Cloud;
