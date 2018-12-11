import _ from 'lodash';

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

  remove(deviceId) {
    const sessionId = _.findKey(this.sessions, i => i.credentials.uuid === deviceId);
    delete this.sessions[sessionId];
  }
}

export default SessionStore;
