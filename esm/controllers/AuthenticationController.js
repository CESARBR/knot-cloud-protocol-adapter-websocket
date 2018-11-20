class AuthenticationController {
  constructor(authenticateInteractor, logger) {
    this.authenticateInteractor = authenticateInteractor;
    this.logger = logger;
  }

  async authenticate(request, responseHandler) {
    try {
      const response = await this.authenticateInteractor.execute(request.id, request.data);
      this.logger.info('Authenticated');
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      this.logger.error(`Failed authenticating (${error.code || 500}): ${error.message}`);
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }
}

export default AuthenticationController;
