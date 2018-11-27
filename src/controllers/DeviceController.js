class DeviceController {
  constructor(
    registerInteractor,
    updateMetadataInteractor,
    devicesInteractor,
    unregisterInteractor,
    logger,
  ) {
    this.updateMetadataInteractor = updateMetadataInteractor;
    this.registerInteractor = registerInteractor;
    this.devicesInteractor = devicesInteractor;
    this.unregisterInteractor = unregisterInteractor;
    this.logger = logger;
  }

  async register(request, responseHandler) {
    try {
      const response = await this.registerInteractor.execute(request.id, request.data);
      this.logger.info('Device registered');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed registering device (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }

  async updateMetadata(request, responseHandler) {
    try {
      const response = await this.updateMetadataInteractor.execute(request.id, request.data);
      this.logger.info('Device metadata updated');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed updating device metadata (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }

  async list(request, responseHandler) {
    try {
      const response = await this.devicesInteractor.execute(request.id, request.data.query);
      this.logger.info('Devices obtained');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed to get devices (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }

  async unregister(request, responseHandler) {
    try {
      const response = await this.unregisterInteractor.execute(request.id, request.data);
      this.logger.info('Unregister');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed unregistering (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }
}

export default DeviceController;
