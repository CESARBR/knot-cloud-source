/* eslint-disable no-console */
const meshblu = require('meshblu');
const config = require('config'); // eslint-disable-line import/no-extraneous-dependencies
const isBase64 = require('is-base64'); // eslint-disable-line import/no-extraneous-dependencies

require('yargs') // eslint-disable-line import/no-extraneous-dependencies
  .command({
    command: 'setdata <thing_uuid> <sensor_id> <sensor_value>',
    desc: 'Sets the value in the specified id from the thing with the specified uuid',
    builder: (yargs) => {
      yargs
        .option('token', {
          alias: 't',
          describe: 'Owner token',
          demandOption: !config.has('cloud.token'),
          default: config.has('cloud.token') ? config.get('cloud.token') : undefined,
        })
        .positional('thing_uuid', {
          describe: 'Thing UUID',
        })
        .positional('sensor_id', {
          describe: 'ID of the sensor to be updated',
        })
        .positional('sensor_value', {
          describe: 'Value to set the sensor to. Supported types: boolean, number or Base64 strings',
          coerce: (value) => {
            if (isNaN(value)) { // eslint-disable-line no-restricted-globals
              if (value === 'true' || value === 'false') {
                return (value === 'true');
              }
              if (!isBase64(value)) {
                throw new Error('Supported types are boolean, number or Base64 strings');
              }
              return value;
            }

            return parseFloat(value);
          },
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
            value: argv.sensor_value,
          }],
        }, (result) => {
          console.log(`Name: ${JSON.stringify(result.name, null, 2)}`);
          console.log(`Type: ${JSON.stringify(result.type, null, 2)}`);
          console.log(`ID: ${JSON.stringify(result.id, null, 2)}`);
          console.log(`UUID: ${JSON.stringify(result.uuid, null, 2)}`);
          console.log(`Online: ${JSON.stringify(result.online, null, 2)}`);
          console.log(`Sensor ID: ${JSON.stringify(result.set_data[0].sensor_id, null, 2)}`);
          console.log(`Value: ${JSON.stringify(result.set_data[0].value, null, 2)}`);
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
