class DeviceController {
  constructor(registerInteractor, logger) {
    this.registerInteractor = registerInteractor;
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
}

export default DeviceController;
