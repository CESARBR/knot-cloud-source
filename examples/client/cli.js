const config = require('../../config');
const fs = require('fs');

let data;
if (config.knotInstanceType === 'gateway') {
  data = JSON.parse(fs.readFileSync('/etc/knot/gatewayConfig.json', 'utf-8'));
}
require('yargs') // eslint-disable-line import/no-extraneous-dependencies, no-unused-expressions
  .option('server', {
    alias: 's',
    describe: 'cloud server hostname',
    demandOption: config.knotInstanceType === 'cloud',
    default: config.knotInstanceType === 'cloud' ? 'knot-test.cesar.org.br' : data.cloud.serverName,
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
    demandOption: config.knotInstanceType === 'cloud',
    default: config.knotInstanceType === 'gateway' ? data.cloud.uuid : null,
  })
  .commandDir('cmds')
  .demandCommand()
  .alias('h', 'help')
  .help()
  .argv;
