const config = require('./config');

require('yargs') // eslint-disable-line import/no-extraneous-dependencies, no-unused-expressions
  .option('server', {
    alias: 's',
    describe: 'cloud server hostname',
    demandOption: config.serverName === '',
    default: config.serverName,
  })
  .option('port', {
    alias: 'p',
    describe: 'cloud server port',
    demandOption: config.port === '',
    default: config.port,
  })
  .option('uuid', {
    alias: 'u',
    describe: 'owner UUID',
    demandOption: config.uuid === '',
    default: config.uuid,
  })
  .commandDir('cmds')
  .demandCommand()
  .alias('h', 'help')
  .help()
  .argv;
