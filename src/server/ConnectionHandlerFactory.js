import shortid from 'shortid';

import Client from 'network/Client';
import ConnectionHandler from 'server/ConnectionHandler';

class ConnectionHandlerFactory {
  constructor(cloudFactory, loggerFactory) {
    this.cloudFactory = cloudFactory;
    this.loggerFactory = loggerFactory;
  }

  create(socket) {
    const client = new Client(socket);
    const cloud = this.cloudFactory.create();
    const id = shortid.generate();
    const logger = this.loggerFactory.create(`ConnectionHandler-${id}`);
    return new ConnectionHandler(client, cloud, logger);
  }
}

export default ConnectionHandlerFactory;
