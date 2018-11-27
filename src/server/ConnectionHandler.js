class ConnectionHandler {
  constructor(id, authenticationController, deviceController, client, cloud, logger) {
    this.id = id;
    this.authenticationController = authenticationController;
    this.deviceController = deviceController;
    this.client = client;
    this.cloud = cloud;
    this.logger = logger;
    this.handlers = {
      identity: this.createHandler(this.authenticationController.authenticate
        .bind(this.authenticationController)),
      registerDevice: this.createHandler(this.deviceController.register
        .bind(this.deviceController)),
      updateMetadata: this.createHandler(this.deviceController.updateMetadata
        .bind(this.deviceController)),
      devices: this.createHandler(this.deviceController.list
        .bind(this.deviceController)),
      unregister: this.createHandler(this.deviceController.unregister
        .bind(this.deviceController)),
      schema: this.createHandler(this.deviceController.updateSchema
        .bind(this.deviceController)),
    };
  }

  async start() {
    this.cloud.on('message', this.onCloudMessage.bind(this));
    this.cloud.on('config', this.onCloudConfig.bind(this));
    this.cloud.on('data', this.onCloudData.bind(this));
    this.started = this.cloud.start();
    this.client.on('message', this.onClientMessage.bind(this));
    this.client.on('close', this.onClientClose.bind(this));
    this.client.on('error', this.onClientError.bind(this));
    await this.started;
    this.logger.info('Connected');
  }

  async onClientMessage(event) {
    try {
      await this.started;
      const handler = this.getHandler(event.type);
      this.logger.info(`Handling '${event.type}'`);
      await handler(event.data);
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
    this.cloud.close();
  }

  onClientError(error) {
    this.logger.error(error.message);
  }

  onCloudMessage(channel, message) {
    this.logger.debug(`Message: ${channel} - ${message}`);
  }

  onCloudConfig(channel, message) {
    this.logger.debug(`Config: ${channel} - ${message}`);
  }

  onCloudData(channel, message) {
    this.logger.debug(`Data: ${channel} - ${message}`);
  }

  createHandler(controllerMethod) {
    return async data => controllerMethod({ id: this.id, data }, this.client);
  }
}

export default ConnectionHandler;
