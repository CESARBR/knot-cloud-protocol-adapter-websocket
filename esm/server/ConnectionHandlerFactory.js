import shortid from 'shortid';

import Client from 'network/Client';
import ConnectionHandler from 'server/ConnectionHandler';

class ConnectionHandlerFactory {
  constructor(loggerFactory) {
    this.loggerFactory = loggerFactory;
  }

  create(socket) {
    const client = new Client(socket);
    const id = shortid.generate();
    const logger = this.loggerFactory.create(`ConnectionHandler-${id}`);
    return new ConnectionHandler(client, logger);
  }
}

export default ConnectionHandlerFactory;
