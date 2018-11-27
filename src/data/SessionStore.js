class SessionStore {
  constructor() {
    this.sessions = {};
  }

  get(id) {
    return this.sessions[id];
  }

  save(id, session) {
    this.sessions[id] = session;
  }

  remove(id) {
    delete this.sessions[id];
  }
}

export default SessionStore;
