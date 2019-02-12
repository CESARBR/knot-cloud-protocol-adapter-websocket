import http from 'http';
import WebSocket from 'ws';

class Server {
  constructor(port, connectionHandlerFactory, logger) {
    this.port = port;
    this.connectionHandlerFactory = connectionHandlerFactory;
    this.logger = logger;
  }

  async start() {
    const server = http.createServer();
    server.on('request', this.onRequest.bind(this));

    const wss = new WebSocket.Server({ server });
    wss.on('connection', this.onConnection.bind(this));
    wss.on('error', this.onError.bind(this));
    wss.on('close', this.onClose.bind(this));

    return new Promise((resolve) => {
      server.listen(this.port, () => {
        this.logger.info(`Listening on ${this.port}`);
        resolve();
      });
    });
  }

  onRequest(request, response) {
    if (request.url === '/healthcheck') {
      response.writeHead(200);
      response.write(JSON.stringify({ online: true }));
      response.end();
      return;
    }

    response.writeHead(404);
    response.end();
  }

  async onConnection(socket) {
    try {
      const connectionHandler = this.connectionHandlerFactory.create(socket);
      await connectionHandler.start();
    } catch (error) {
      this.logger.error(`Failed to start connection handler: ${error.message}`);
      socket.close();
    }
  }

  onError(error) {
    this.logger.error(error.message);
  }

  onClose() {
    this.logger.info('Closed');
  }
}

export default Server;
