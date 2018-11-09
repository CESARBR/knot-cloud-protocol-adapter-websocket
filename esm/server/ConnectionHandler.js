class ConnectionHandler {
  constructor(client, logger) {
    this.client = client;
    this.logger = logger;
    this.handlers = {};
  }

  async start() {
    this.client.on('message', this.onClientMessage.bind(this));
    this.client.on('close', this.onClientClose.bind(this));
    this.client.on('error', this.onClientError.bind(this));
    this.logger.info('Connected');
  }

  async onClientMessage(event) {
    try {
      const handler = this.getHandler(event.type);
      const response = await handler(event.data);
      await this.client.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed processing client message: ${error.message}`);
      this.logger.debug('Event:', event);
    }
  }

  getHandler(type) {
    if (!this.handlers[type]) {
      throw new Error(`Unknown event type '${type}'`);
    }
    return this.handlers[type];
  }

  onClientClose(code, reason) {
    this.logger.info('Disconnected');
    this.logger.debug(`Disconnect code: ${code}`);
    this.logger.debug(`Disconnect reason: ${reason}`);
  }

  onClientError(error) {
    this.logger.error(error.message);
  }
}

export default ConnectionHandler;
