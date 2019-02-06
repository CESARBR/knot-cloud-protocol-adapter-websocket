class DeviceController {
  constructor(
    registerInteractor,
    updateMetadataInteractor,
    devicesInteractor,
    unregisterInteractor,
    updateSchemaInteractor,
    createSessionTokenInteractor,
    activateInteractor,
    getDataInteractor,
    setDataInteractor,
    logger,
  ) {
    this.updateMetadataInteractor = updateMetadataInteractor;
    this.registerInteractor = registerInteractor;
    this.devicesInteractor = devicesInteractor;
    this.unregisterInteractor = unregisterInteractor;
    this.updateSchemaInteractor = updateSchemaInteractor;
    this.createSessionTokenInteractor = createSessionTokenInteractor;
    this.activateInteractor = activateInteractor;
    this.getDataInteractor = getDataInteractor;
    this.setDataInteractor = setDataInteractor;
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
      this.logger.info('Unregistered');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed unregistering (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }

  async updateSchema(request, responseHandler) {
    try {
      const response = await this.updateSchemaInteractor.execute(request.id, request.data);
      this.logger.info('Schema updated');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed in update schema (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }

  async createSessionToken(request, responseHandler) {
    try {
      const response = await this.createSessionTokenInteractor.execute(request.id, request.data);
      this.logger.info('Token created');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed in create token (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }

  async activateDevice(request, responseHandler) {
    try {
      const response = await this.activateInteractor.execute(request.id, request.data);
      this.logger.info('Device activated');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed in activate device (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }

  async getData(request, responseHandler) {
    try {
      const response = await this.getDataInteractor.execute(request.id, request.data);
      this.logger.info('\'getData\' sent');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed sending 'getData' (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }

  async setData(request, responseHandler) {
    try {
      const response = await this.setDataInteractor.execute(request.id, request.data);
      this.logger.info('\'setData\' sent');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed sending 'setData' (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }
}

export default DeviceController;
