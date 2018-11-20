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
      const error = new Error(response.metadata.status);
      error.code = response.metadata.code;
      throw error;
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
