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

  removeByUuid(uuid) {
    const id = _.findKey(this.sessions, i => i.credentials.uuid === uuid);
    delete this.sessions[id];
  }
}

export default SessionStore;
