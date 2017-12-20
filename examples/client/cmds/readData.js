/* eslint-disable no-console */
const http = require('http');
require('yargs') // eslint-disable-line import/no-extraneous-dependencies
  .command({
    command: 'data <thing_uuid>',
    desc: 'Returns data from cloud',
    builder: (yargs) => {
      yargs
        .option('token', {
          alias: 't',
          describe: 'owner token',
          demandOption: true,
        });
    },
    handler: (argv) => {
      const options = {
        host: argv.server,
        port: argv.port,
        path: `/data/${argv.thing_uuid}`,
        headers: {
          meshblu_auth_uuid: argv.uuid,
          meshblu_auth_token: argv.token,
          'Content-Type': 'application/json',
        },
      };
      http.get(options, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];
        let error;
        let rawData = '';
        if (statusCode !== 200) {
          error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error(`Invalid content-type.\nExpected application/json but received ${contentType}`);
        }
        if (error) {
          console.log(error.message);
          res.resume();
          return;
        }
        res.setEncoding('utf8');
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsedData;
          try {
            parsedData = JSON.parse(rawData);
            console.log(parsedData.data);
          } catch (e) {
            console.log(e.message);
          }
        }).on('error', (e) => {
          console.log(`Got error: ${e.message}`);
        });
      });
    },
  });
