import throwError from './util/throwError';

class CreateSessionToken {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      throwError('Unauthorized', 401);
    }

    // TODO: Verify the property createdAt to expire the token
    const { token } = await this.cloud.createSessionToken(credentials, data.id);

    return { type: 'created', data: token };
  }
}

export default CreateSessionToken;
