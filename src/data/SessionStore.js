class SessionStore {
  constructor() {
    this.sessions = {};
  }

  get(id) {
    return this.sessions[id];
  }

  getByUuid(uuid) {
    const values = Object.values(this.sessions);
    return values.find(obj => obj.uuid === uuid);
  }

  save(id, session) {
    this.sessions[id] = session;
  }
}

export default SessionStore;
