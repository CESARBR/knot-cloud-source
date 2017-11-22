require('yargs') // eslint-disable-line import/no-extraneous-dependencies, no-unused-expressions
  .option('server', {
    alias: 's',
    describe: 'cloud server hostname',
    demandOption: true,
    default: 'knot-test.cesar.org.br',
  })
  .option('port', {
    alias: 'p',
    describe: 'cloud server port',
    demandOption: true,
    default: '3000',
  })
  .option('uuid', {
    alias: 'u',
    describe: 'owner UUID',
    demandOption: true,
  })
  .option('token', {
    alias: 't',
    describe: 'owner token',
    demandOption: true,
  })
  .commandDir('cmds')
  .demandCommand()
  .alias('h', 'help')
  .help()
  .argv;
