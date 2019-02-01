import _ from 'lodash';

class UpdateMetadata {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      this.throwError('Unauthorized', 401);
    }

    await this.cloud.updateDevice(credentials, data.id, _.mapKeys(data.metadata, (value, key) => `metadata.${key}`));
    return { type: 'updated' };
  }

  throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

export default UpdateMetadata;
