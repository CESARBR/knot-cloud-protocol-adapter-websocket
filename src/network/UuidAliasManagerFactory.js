import UuidAliasManager from 'network/UuidAliasManager';

class UuidAliasManagerFactory {
  constructor(settings, uuidAliasResolver) {
    this.settings = settings;
    this.uuidAliasResolver = uuidAliasResolver;
  }

  create() {
    return new UuidAliasManager(this.settings.meshblu.aliasServerUri, this.uuidAliasResolver);
  }
}

export default UuidAliasManagerFactory;
