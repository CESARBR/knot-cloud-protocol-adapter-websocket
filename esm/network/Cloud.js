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

  async handleError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  async authenticate(credentials) {
    const request = {
      metadata: {
        auth: credentials,
        jobType: 'Authenticate',
      },
    };
    let response;
    try {
      response = await this.send(request);
    } catch (error) {
      const badGatewayError = new Error('Bad Gateway');
      badGatewayError.code = 502;
      throw badGatewayError;
    }

    if (!response) {
      const timeoutError = new Error('Gateway Timeout');
      timeoutError.code = 504;
      throw timeoutError;
    }

    if (response.metadata.code !== 204) {
      const error = new Error(response.status);
      error.code = response.code;
      throw error;
    }
  }

  async registerDevice(device) {
    const request = {
      metadata: {
        jobType: 'RegisterDevice',
      },
      rawData: JSON.stringify(device),
    };
    let response;

    try {
      response = await this.send(request);
    } catch (error) {
      this.handleError('Bad Gateway', 502);
    }

    if (!response) {
      this.handleError('Gateway Timeout', 504);
    }

    if (response.metadata.code !== 201) {
      this.handleError(response.metadata.status, response.metadata.code);
    }

    return JSON.parse(response.rawData);
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
    let response;

    try {
      response = await this.send(request);
    } catch (error) {
      this.handleError('Bad Gateway', 502);
    }

    if (!response) {
      this.handleError('Gateway Timeout', 504);
    }

    if (response.metadata.code !== 200) {
      this.handleError(response.metadata.status, response.metadata.code);
    }

    return JSON.parse(response.rawData);
  }

  async getDevices(credentials) {
    const request = {
      metadata: {
        jobType: 'SearchDevices',
        auth: credentials,
        fromUuid: credentials.uuid,
      },
    };
    let response;

    try {
      response = await this.send(request);
    } catch (error) {
      this.handleError('Bad Gateway', 502);
    }

    if (!response) {
      this.handleError('Gateway Timeout', 504);
    }

    if (response.metadata.code !== 200) {
      this.handleError(response.metadata.status, response.metadata.code);
    }

    return JSON.parse(response.rawData);
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
