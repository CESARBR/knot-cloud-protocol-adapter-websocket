class Authenticate {
  constructor(sessionStore, cloud) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
  }

  async execute(id, credentials) {
    await this.cloud.authenticate(credentials);
    this.createOrUpdateSession(id, credentials);
    return { type: 'ready' };
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
