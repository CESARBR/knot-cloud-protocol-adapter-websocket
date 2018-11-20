import SettingsFactory from 'data/SettingsFactory';
import SessionStore from 'data/SessionStore';
import LoggerFactory from 'LoggerFactory';
import CloudRequesterFactory from 'network/CloudRequesterFactory';
import UuidAliasResolverFactory from 'network/UuidAliasResolverFactory';
import CloudFactory from 'network/CloudFactory';
import ConnectionHandlerFactory from 'server/ConnectionHandlerFactory';
import ServerFactory from 'server/ServerFactory';

async function main() {
  try {
    const settings = new SettingsFactory().create();
    const loggerFactory = new LoggerFactory(settings);

    const sessionStore = new SessionStore();

    const cloudRequester = new CloudRequesterFactory(settings).create();
    const uuidAliasResolver = new UuidAliasResolverFactory(settings).create();
    const cloudFactory = new CloudFactory(cloudRequester, uuidAliasResolver, settings);
    const connectionHandlerFactory = new ConnectionHandlerFactory(
      sessionStore,
      cloudFactory,
      loggerFactory,
    );
    const serverFactory = new ServerFactory(settings, connectionHandlerFactory, loggerFactory);
    const server = serverFactory.create();

    await cloudRequester.start();
    await server.start();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
    process.exit(1);
  }
}

main();
