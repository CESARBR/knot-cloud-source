/* eslint-disable no-console */
const meshblu = require('meshblu');
const config = require('config'); // eslint-disable-line import/no-extraneous-dependencies
require('yargs') // eslint-disable-line import/no-extraneous-dependencies
  .command({
    command: 'subscribe <thing_uuid>',
    desc: 'Subscribe to a device\'s messages',
    builder: (yargs) => {
      yargs
        .option('token', {
          alias: 't',
          describe: 'owner token',
          demandOption: !config.has('cloud.token'),
	  default: config.has('cloud.token') ? config.get('cloud.token') : undefined,
        })
        .option('type', {
          describe: 'type of subscription',
          default: ['sent'],
        })
        .array('type');
    },
    handler: (argv) => {
      const conn = meshblu.createConnection({
        server: argv.server,
        port: argv.port,
        uuid: argv.uuid,
        token: argv.token,
      });

      conn.on('ready', () => {
        console.log(`Subscribing to ${argv.thing_uuid} device`);
        conn.subscribe({
          uuid: argv.thing_uuid,
          type: argv.type,
        }, (res) => {
          const { result } = res;
          if (result) {
            console.log(`Successful subscription to ${argv.thing_uuid} device`);
          } else {
            const messageError = res.error.error.message;
            console.error(`Subscription failed: ${messageError}`);
            conn.close(() => {});
          }
        });
      });

      conn.on('message', (data) => {
	console.log("--message--");
        console.log(data);
      });

      conn.on('updated', (data) => {
	console.log("--updated--");
        console.log(data);
      });

      conn.on('config', (data) => {
	console.log("--config--");
        console.log(data);
        console.log();
      });

      conn.on('unregistered', (data) => {
	console.log("--unregistered--");
        console.log(data);
      });

      conn.on('notReady', () => {
        console.log('Connection not authorized');
        conn.close(() => {});
      });
    },
  });
