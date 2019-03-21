/* eslint-disable no-console */
const meshblu = require('@cesarbr/meshblu');
const config = require('config'); // eslint-disable-line import/no-extraneous-dependencies

require('yargs') // eslint-disable-line import/no-extraneous-dependencies
  .command({
    command: 'getdata <thing_uuid> <sensor_id>',
    desc: 'Requests the current value of <sensor_id> from <thing_uuid>',
    builder: (yargs) => {
      yargs
        .option('token', {
          alias: 't',
          describe: 'owner token',
          demandOption: !config.has('cloud.token'),
          default: config.has('cloud.token') ? config.get('cloud.token') : undefined,
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
        console.log(`Getting data from sensor ${argv.sensor_id} on thing ${argv.thing_uuid}`);
        conn.update({
          uuid: argv.thing_uuid,
          get_data: [{
            sensor_id: argv.sensor_id,
          }],
        }, (result) => {
          console.log(`Name: ${JSON.stringify(result.name, null, 2)}`);
          console.log(`Type: ${JSON.stringify(result.type, null, 2)}`);
          console.log(`ID: ${JSON.stringify(result.id, null, 2)}`);
          console.log(`UUID: ${JSON.stringify(result.uuid, null, 2)}`);
          console.log(`Online: ${JSON.stringify(result.online, null, 2)}`);
          console.log(`Sensor ID: ${JSON.stringify(result.get_data[0].sensor_id, null, 2)}`);
          console.log();
          conn.close(() => {});
        });
      });

      conn.on('notReady', () => {
        console.log('Connection not authorized');
        conn.close(() => {});
      });
    },
  });
