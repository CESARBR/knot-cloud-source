/* eslint-disable no-console */
const meshblu = require('meshblu');
require('yargs') // eslint-disable-line import/no-extraneous-dependencies
  .command({
    command: 'setdata <thing_uuid> <sensor_id> <sensor_value>',
    desc: 'Sets the value in the specified id from the thing with the specified uuid',
    builder: (yargs) => {
      yargs
        .option('token', {
          alias: 't',
          describe: 'owner token',
          demandOption: true,
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
        console.log(`Setting data item from sensor ${argv.sensor_id} on thing ${argv.thing_uuid}`);
        conn.update({
          uuid: argv.thing_uuid,
          set_data: [{
            sensor_id: argv.sensor_id,
            value: !isNaN(argv.sensor_value) ? parseFloat(argv.sensor_value) : ((argv.sensor_value === 'true') || false), // eslint-disable-line no-restricted-globals
          }],
        }, (result) => {
          console.log(`Name: ${JSON.stringify(result.name, null, 2)}`);
          console.log(`Type: ${JSON.stringify(result.type, null, 2)}`);
          console.log(`UUID: ${JSON.stringify(result.uuid, null, 2)}`);
          console.log(`Online: ${JSON.stringify(result.online, null, 2)}`);
          console.log(`ID: ${JSON.stringify(result.set_data[0].sensor_id, null, 2)}`);
          console.log(`Value: ${JSON.stringify(result.set_data[0].value, null, 2)}`);
          console.log();
        });
      });

      conn.on('notReady', () => {
        console.log('Connection not authorized');
      });
    },
  });
