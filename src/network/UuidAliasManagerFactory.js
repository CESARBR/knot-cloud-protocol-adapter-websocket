import UuidAliasManager from 'network/UuidAliasManager';

class UuidAliasManagerFactory {
  constructor(settings) {
    this.settings = settings;
  }

  create() {
    return new UuidAliasManager(this.settings.meshblu.aliasServerUri);
  }
}

export default UuidAliasManagerFactory;
