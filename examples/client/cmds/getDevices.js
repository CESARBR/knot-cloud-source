/* eslint-disable no-console */
const meshblu = require('meshblu');
const config = require('../config');

require('yargs') // eslint-disable-line import/no-extraneous-dependencies
  .command({
    command: 'devices',
    desc: 'Returns the devices from all gateways',
    builder: (yargs) => {
      yargs
        .option('token', {
          alias: 't',
          describe: 'owner token',
          demandOption: config.token === '',
          default: config.token,
        });
    },
    handler: (argv) => {
      const conn = meshblu.createConnection({
        server: argv.server,
        port: argv.port,
        uuid: argv.uuid,
        token: argv.token,
      });

      conn.on('ready', () => {
        console.log('Getting devices from gateways');
        conn.devices({
          gateways: ['*'],
        }, (result) => {
          if (result.error) {
            console.log(result);
          } else {
            for (let i = 0; i < result.length; i += 1) {
              console.log(`Device: ${i}`);
              console.log(`Name: ${JSON.stringify(result[i].name, null, 2)}`);
              console.log(`Type: ${JSON.stringify(result[i].type, null, 2)}`);
              console.log(`UUID: ${JSON.stringify(result[i].uuid, null, 2)}`);
              console.log(`Online: ${JSON.stringify(result[i].online, null, 2)}`);
              console.log();
            }
          }
          conn.close(() => {});
        });
      });

      conn.on('notReady', () => {
        console.log('Connection not authorized');
        conn.close(() => {});
      });
    },
  });
