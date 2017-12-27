const yargs = require('yargs'); // eslint-disable-line import/no-extraneous-dependencies

yargs // eslint-disable-line no-unused-expressions
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
  .commandDir('cmds')
  .demandCommand()
  .check((argv) => {
    const commands = yargs.getCommandInstance().getCommands();
    if (commands.indexOf(argv._[0]) === -1) {
      throw new Error('Invalid command');
    } else {
      return true;
    }
  }, false)
  .alias('h', 'help')
  .help()
  .argv;
