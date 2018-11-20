import shortid from 'shortid';

import Client from 'network/Client';
import ConnectionHandler from 'server/ConnectionHandler';

import Authenticate from 'interactors/Authenticate';
import AuthenticationController from 'controllers/AuthenticationController';

class ConnectionHandlerFactory {
  constructor(sessionStore, cloudFactory, loggerFactory) {
    this.sessionStore = sessionStore;
    this.cloudFactory = cloudFactory;
    this.loggerFactory = loggerFactory;
  }

  create(socket) {
    const client = new Client(socket);
    const cloud = this.cloudFactory.create();
    const id = shortid.generate();

    const authenticate = new Authenticate(this.sessionStore, cloud);
    const authenticationCtrlLogger = this.loggerFactory.create(`AuthenticationController-${id}`);
    const authenticationController = new AuthenticationController(
      authenticate,
      authenticationCtrlLogger,
    );

    const handlerLogger = this.loggerFactory.create(`ConnectionHandler-${id}`);
    return new ConnectionHandler(id, authenticationController, client, cloud, handlerLogger);
  }
}

export default ConnectionHandlerFactory;
