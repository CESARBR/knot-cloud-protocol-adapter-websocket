import WebSocket from 'ws';

class Server {
  constructor(port, connectionHandlerFactory, logger) {
    this.port = port;
    this.connectionHandlerFactory = connectionHandlerFactory;
    this.logger = logger;
  }

  async start() {
    const server = new WebSocket.Server({ port: this.port });
    server.on('connection', this.onConnection.bind(this));
    server.on('error', this.onError.bind(this));
    server.on('close', this.onClose.bind(this));
    this.logger.info(`Listening on ${this.port}`);
  }

  async onConnection(socket) {
    const connectionHandler = this.connectionHandlerFactory.create(socket);
    await connectionHandler.start();
  }

  onError(error) {
    this.logger.error(error.message);
  }

  onClose() {
    this.logger.info('Closed');
  }
}

export default Server;
