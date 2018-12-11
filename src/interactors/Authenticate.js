class Authenticate {
  constructor(sessionStore, cloud, uuidAliasManager) {
    this.sessionStore = sessionStore;
    this.cloud = cloud;
    this.uuidAliasManager = uuidAliasManager;
  }

  async execute(requestId, credentials) {
    const credentialsToSave = {
      uuid: credentials.uuid,
      token: credentials.token,
    };
    if (Object.prototype.hasOwnProperty.call(credentials, 'id')) {
      credentialsToSave.uuid = await this.uuidAliasManager.resolve(credentials.id);
    }

    await this.cloud.authenticate(credentialsToSave);
    this.createOrUpdateSession(requestId, credentialsToSave);
    return { type: 'ready' };
  }

  createOrUpdateSession(requestId, credentials) {
    let session = this.sessionStore.get(requestId);
    if (!session) {
      session = { credentials };
    }

    this.sessionStore.save(requestId, session);
  }
}

export default Authenticate;
