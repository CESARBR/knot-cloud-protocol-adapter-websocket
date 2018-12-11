import MessengerManagerFactory from 'meshblu-core-manager-messenger/factory';
import Cloud from 'network/Cloud';

class CloudFactory {
  constructor(cloudRequester, uuidAliasResolver, settings) {
    this.cloudRequester = cloudRequester;
    this.uuidAliasResolver = uuidAliasResolver;
    this.settings = settings;
  }

  create() {
    const messengerFactory = new MessengerManagerFactory({
      uuidAliasResolver: this.uuidAliasResolver,
      namespace: this.settings.meshblu.namespace,
      redisUri: this.settings.meshblu.firehoseRedisUri,
    });
    const messenger = messengerFactory.build();
    return new Cloud(
      this.cloudRequester,
      messenger,
      this.uuidAliasResolver,
      this.settings.meshblu.aliasServerUri,
    );
  }
}

export default CloudFactory;
