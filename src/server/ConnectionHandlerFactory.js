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
import CreateSessionToken from 'interactors/CreateSessionToken';
import RevokeSessionToken from 'interactors/RevokeSessionToken';
import ActivateDevice from 'interactors/ActivateDevice';
import PublishData from 'interactors/PublishData';
import GetData from 'interactors/GetData';
import SetData from 'interactors/SetData';
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
    const uuidAliasManager = this.uuidAliasManagerFactory.create();
    const cloud = this.cloudFactory.create(uuidAliasManager);
    const id = shortid.generate();

    const authenticate = new Authenticate(this.sessionStore, cloud, uuidAliasManager);
    const authenticationCtrlLogger = this.loggerFactory.create(`AuthenticationController-${id}`);
    const authenticationController = new AuthenticationController(
      authenticate,
      authenticationCtrlLogger,
    );

    const registerDevice = new RegisterDevice(this.sessionStore, cloud, uuidAliasManager);
    const updateMetadata = new UpdateMetadata(this.sessionStore, cloud);
    const getDevices = new GetDevices(this.sessionStore, cloud);
    const unregisterDevice = new UnregisterDevice(this.sessionStore, cloud, uuidAliasManager);
    const updateSchema = new UpdateSchema(this.sessionStore, cloud);
    const createSessionToken = new CreateSessionToken(this.sessionStore, cloud);
    const revokeSessionToken = new RevokeSessionToken(this.sessionStore, cloud);
    const activateDevice = new ActivateDevice(this.sessionStore, cloud);
    const publishData = new PublishData(this.sessionStore, cloud);
    const getData = new GetData(this.sessionStore, cloud);
    const setData = new SetData(this.sessionStore, cloud);
    const deviceCtrlLogger = this.loggerFactory.create(`DeviceController-${id}`);
    const deviceController = new DeviceController(
      registerDevice,
      updateMetadata,
      getDevices,
      unregisterDevice,
      updateSchema,
      createSessionToken,
      revokeSessionToken,
      activateDevice,
      publishData,
      getData,
      setData,
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
