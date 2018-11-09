import SettingsFactory from 'data/SettingsFactory';
import LoggerFactory from 'LoggerFactory';
import ConnectionHandlerFactory from 'server/ConnectionHandlerFactory';
import ServerFactory from 'server/ServerFactory';

async function main() {
  try {
    const settings = new SettingsFactory().create();
    const loggerFactory = new LoggerFactory(settings);
    const connectionHandlerFactory = new ConnectionHandlerFactory(loggerFactory);
    const serverFactory = new ServerFactory(settings, connectionHandlerFactory, loggerFactory);
    const server = serverFactory.create();

    await server.start();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
    process.exit(1);
  }
}

main();
