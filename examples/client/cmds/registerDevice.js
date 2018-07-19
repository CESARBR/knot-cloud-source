/* eslint-disable no-console */
const http = require('http');

require('yargs') // eslint-disable-line import/no-extraneous-dependencies
  .command({
    command: 'register <thing_name> <thing_id>',
    desc: 'Register a new device on cloud/fog',
    handler: (argv) => {
      const options = {
        host: argv.server,
        port: argv.port,
        path: '/devices',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const reqData = {
        owner: argv.uuid,
        name: argv.thing_name,
        type: 'KNOTDevice',
        id: argv.thing_id,
      };
      const req = http.request(options, (res) => {
        let rawData = '';
        console.log('Registering a thing...');
        if (res.statusCode !== 201) {
          console.error(`Request failed.\nStatus Code: ${res.statusCode}\n`);
          res.resume();
          return;
        }
        res.setEncoding('utf8');
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let thingData;
          try {
            thingData = JSON.parse(rawData);
            console.log(`Name: ${thingData.name}`);
            console.log(`Type: ${thingData.type}`);
            console.log(`ID: ${thingData.id}`);
            console.log(`UUID: ${thingData.uuid}`);
            console.log(`Owner: ${thingData.owner}`);
            console.log(`Token: ${thingData.token}`);
            console.log(`Online: ${thingData.online}`);
          } catch (e) {
            console.error(e.message);
          }
        });
      });

      req.on('error', (err) => {
        console.error(`Got error: ${err.message}`);
      });
      req.write(JSON.stringify(reqData));
      req.end();
    },
  });
