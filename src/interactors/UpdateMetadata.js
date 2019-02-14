import _ from 'lodash';
import throwError from './throwError';

class UpdateMetadata {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(requestId, data) {
    const { credentials } = this.sessionStore.get(requestId);
    if (!credentials) {
      throwError('Unauthorized', 401);
    }

    await this.cloud.updateDevice(credentials, data.id, _.mapKeys(data.metadata, (value, key) => `metadata.${key}`));
    return { type: 'updated' };
  }
}

export default UpdateMetadata;
