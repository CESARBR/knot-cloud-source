'use strict';
require('coffee-script/register');
require('dotenv').config({ path: '/usr/local/bin/knot-fog-source/.env' });

if ((process.env.USE_APP_DYNAMICS || 'false').toLowerCase() === 'true') {
  require('./lib/appdynamics');
}


var program = require('commander');
var pjson = require('./package.json');
var config = require('./config');

var parentConnection;

program
  .version(pjson.version)
  .option('-e, --environment <', 'Set the environment (defaults to development, override with NODE_ENV)')
  // .option('--http-port <n>', 'Set the HTTP port (defaults to 3000)')
  // .option('--https-port <n>', 'Set the HTTP port (defaults to null)')
  // .option('--mqtt-port <n>', 'Set the MQTT port (defaults to 1883)')
  // .option('--coap-port <n>', 'Set the CoAP port (defaults to 5683)')
  .option('--coap', 'Enable CoAP server (defaults to false)')
  .option('--http', 'Enable HTTP server (defaults to false)')
  .option('--https', 'Enable HTTPS server (defaults to false)')
  .option('--mdns', 'Enable Multicast DNS (defaults to false)')
  .option('--mqtt', 'Enable MQTT server (defaults to false)')
  .option('--noparent', 'Disable Parent Connection (defaults to false)')
  .parse(process.argv);

// Defaults
program.environment = program.environment || process.env.NODE_ENV || 'development';
// program.coapPort    = program.coapPort || 5683;
// program.httpPort    = program.httpPort || 3000;
// program.httpsPort   = program.httpsPort || 4000;
// program.mqttPort    = program.mqttPort || 1883;
program.coap          = program.coap || false;
program.http          = program.http || false;
program.https         = program.https || false;
program.mdns          = program.mdns || false;
program.mqtt          = program.mqtt || false;
program.noparent      = program.noparent || false;

console.log("");
console.log("MM    MM              hh      bb      lll         ");
console.log("MMM  MMM   eee   sss  hh      bb      lll uu   uu ");
console.log("MM MM MM ee   e s     hhhhhh  bbbbbb  lll uu   uu ");
console.log("MM    MM eeeee   sss  hh   hh bb   bb lll uu   uu ");
console.log("MM    MM  eeeee     s hh   hh bbbbbb  lll  uuuu u ");
console.log("                 sss                              ");
console.log('\Meshblu (formerly skynet.im) %s environment loaded... ', program.environment);
console.log("");

if (process.env.AIRBRAKE_KEY) {
  var airbrakeErrors = require("./lib/airbrakeErrors");
  airbrakeErrors.handleExceptions()
} else {
  process.on("uncaughtException", function(error) {
    console.error(error.stack);
    process.exit(1);
  });
}

if (!program.noparent) {
  parentConnection = require('./lib/knotParentConnection').openParentConnection(config);
}
else {
  if (!config.uuid) {
    console.error('config.uuid or environment variable UUID is required. Exiting.');
    process.exit(1);
  }
}

if (program.coap) {
  process.stdout.write('Starting CoAP...');
  var coapServer = require('./lib/coapServer')(config, parentConnection);
  console.log(' done.');
}

if (true || program.http || program.https) {
  process.stdout.write('Starting HTTP/HTTPS...');
  var httpServer = require('./lib/httpServer')(config, parentConnection);
  console.log(' done.');
}

if (program.mdns) {
  process.stdout.write('Starting mDNS...');
  var mdnsServer = require('./lib/mdnsServer')(config);
  mdnsServer.start();
  console.log(' done.');
}

if (program.mqtt) {
  process.stdout.write('Starting MQTT...');
  var mqttServer = require('./lib/mqttServer')(config, parentConnection);
  console.log(' done.');
}

process.on('SIGTERM', function(){
  console.log('SIGTERM caught, exiting');
  process.exit(0);
})
