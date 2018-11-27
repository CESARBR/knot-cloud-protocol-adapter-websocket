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

  removeById(deviceId) {
    const id = _.findKey(this.sessions, i => i.credentials.uuid === deviceId);
    delete this.sessions[id];
  }
}

export default SessionStore;
