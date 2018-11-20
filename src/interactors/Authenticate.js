import _ from 'lodash';

class Authenticate {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, credentials) {
    await this.cloud.authenticate(credentials);
    await this.subscribe(credentials);
    this.createOrUpdateSession(id, credentials);
    return { type: 'ready' };
  }

  async subscribe(credentials) {
    const types = ['received', 'config', 'data'];
    const subscriptionPromises = _.map(types,
      type => (this.cloud.subscribe({ type, uuid: credentials.uuid })));
    return Promise.all(subscriptionPromises);
  }

  createOrUpdateSession(id, credentials) {
    let session = this.sessionStore.get(id);
    if (!session) {
      session = { credentials };
    }
    this.sessionStore.save(id, session);
  }
}

export default Authenticate;
