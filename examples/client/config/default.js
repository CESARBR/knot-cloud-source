const fs = require('fs');

const gatewayConfigFile = '/etc/knot/gatewayConfig.json';
const defaultConfig = {
  cloud: {
    serverName: 'knot-test.cesar.org.br',
    port: 3000,
  },
};

function readDefaultConfig() {
  let data;
  if (fs.existsSync(gatewayConfigFile)) {
    data = JSON.parse(fs.readFileSync(gatewayConfigFile, 'utf-8'));
  } else {
    data = defaultConfig;
  }
  return data;
}


module.exports = readDefaultConfig();
