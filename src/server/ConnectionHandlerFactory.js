import shortid from 'shortid';

import Client from 'network/Client';
import ConnectionHandler from 'server/ConnectionHandler';

import Authenticate from 'interactors/Authenticate';
import AuthenticationController from 'controllers/AuthenticationController';

import RegisterDevice from 'interactors/RegisterDevice';
import UpdateMetadata from 'interactors/UpdateMetadata';
import GetDevices from 'interactors/GetDevices';
import UnregisterDevice from 'interactors/UnregisterDevice';
import UpdateSchema from 'interactors/UpdateSchema';
import DeviceController from 'controllers/DeviceController';

class ConnectionHandlerFactory {
  constructor(sessionStore, cloudFactory, loggerFactory, uuidAliasManagerFactory) {
    this.sessionStore = sessionStore;
    this.cloudFactory = cloudFactory;
    this.loggerFactory = loggerFactory;
    this.uuidAliasManagerFactory = uuidAliasManagerFactory;
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

    const uuidAliasManager = this.uuidAliasManagerFactory.create();

    const registerDevice = new RegisterDevice(this.sessionStore, cloud, uuidAliasManager);
    const updateMetadata = new UpdateMetadata(this.sessionStore, cloud);
    const getDevices = new GetDevices(this.sessionStore, cloud);
    const unregisterDevice = new UnregisterDevice(this.sessionStore, cloud);
    const updateSchema = new UpdateSchema(this.sessionStore, cloud);
    const deviceCtrlLogger = this.loggerFactory.create(`DeviceController-${id}`);
    const deviceController = new DeviceController(
      registerDevice,
      updateMetadata,
      getDevices,
      unregisterDevice,
      updateSchema,
      deviceCtrlLogger,
    );

    const handlerLogger = this.loggerFactory.create(`ConnectionHandler-${id}`);
    return new ConnectionHandler(
      id,
      authenticationController,
      deviceController,
      client,
      cloud,
      handlerLogger,
    );
  }
}

export default ConnectionHandlerFactory;
