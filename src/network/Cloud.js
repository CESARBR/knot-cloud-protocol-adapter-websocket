import { promisify } from 'util';

class Cloud {
  constructor(requester, messenger) {
    this.requester = requester;
    this.messenger = messenger;
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

    const connectAsync = promisify(this.messenger.connect.bind(this.messenger));
    await connectAsync(credentials);
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
