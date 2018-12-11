import HydrantManagerFactory from 'meshblu-core-manager-hydrant/factory';
import Cloud from 'network/Cloud';

class CloudFactory {
  constructor(cloudRequester, uuidAliasResolver, settings) {
    this.cloudRequester = cloudRequester;
    this.uuidAliasResolver = uuidAliasResolver;
    this.settings = settings;
  }

  create(uuidAliasManager) {
    const messengerFactory = new HydrantManagerFactory({
      uuidAliasResolver: this.uuidAliasResolver,
      namespace: this.settings.meshblu.messagesNamespace,
      redisUri: this.settings.meshblu.firehoseRedisUri,
    });
    const messenger = messengerFactory.build();
    return new Cloud(
      this.cloudRequester,
      messenger,
      uuidAliasManager,
    );
  }
}

export default CloudFactory;
