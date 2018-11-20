class AuthenticationController {
  constructor(authenticateInteractor) {
    this.authenticateInteractor = authenticateInteractor;
  }

  async authenticate(request, responseHandler) {
    try {
      const response = await this.authenticateInteractor.execute(request.id, request.data);
      await responseHandler.send(response.type, response.data);
    } catch (error) {
      await responseHandler.send('error', {
        code: error.code || 500,
        message: error.message,
      });
    }
  }
}

export default AuthenticationController;
