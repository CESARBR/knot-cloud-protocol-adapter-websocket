import Server from 'server/Server';

class ServerFactory {
  constructor(settings, connectionHandlerFactory, loggerFactory) {
    this.settings = settings;
    this.connectionHandlerFactory = connectionHandlerFactory;
    this.loggerFactory = loggerFactory;
  }

  create() {
    return new Server(
      this.settings.server.port,
      this.connectionHandlerFactory,
      this.loggerFactory.create('Server'),
    );
  }
}

export default ServerFactory;
