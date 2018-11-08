import SettingsFactory from 'data/SettingsFactory';
import LoggerFactory from 'LoggerFactory';

async function main() {
  try {
    const settings = new SettingsFactory().create();
    const loggerFactory = new LoggerFactory(settings); // eslint-disable-line no-unused-vars
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
    process.exit(1);
  }
}

main();
