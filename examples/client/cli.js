const config = require('config'); // eslint-disable-line import/no-extraneous-dependencies
const yargs = require('yargs'); // eslint-disable-line import/no-extraneous-dependencies

yargs // eslint-disable-line no-unused-expressions
  .option('server', {
    alias: 's',
    describe: 'Cloud server hostname',
    demandOption: !config.has('cloud.serverName'),
    default: config.has('cloud.serverName') ? config.get('cloud.serverName') : undefined,
  })
  .option('port', {
    alias: 'p',
    describe: 'Cloud server port',
    demandOption: !config.has('cloud.port'),
    default: config.has('cloud.port') ? config.get('cloud.port') : undefined,
  })
  .option('uuid', {
    alias: 'u',
    describe: 'Owner UUID',
    demandOption: !config.has('cloud.uuid'),
    default: config.has('cloud.uuid') ? config.get('cloud.uuid') : undefined,
  })
  .option('token', {
    alias: 't',
    describe: 'Owner token',
    demandOption: false,
  })
  .commandDir('cmds')
  .demandCommand()
  .strict()
  .alias('h', 'help')
  .help()
  .argv;
