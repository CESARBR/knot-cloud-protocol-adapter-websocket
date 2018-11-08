import config from 'config'; // eslint-disable-line no-unused-vars

import Settings from 'data/Settings';

class SettingsFactory {
  create() {
    return new Settings();
  }
}

export default SettingsFactory;
