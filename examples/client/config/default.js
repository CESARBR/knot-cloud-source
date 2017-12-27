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
    try {
      data = JSON.parse(fs.readFileSync(gatewayConfigFile, 'utf-8'));
    } catch (err) {
      data = defaultConfig;
    }
  } else {
    data = defaultConfig;
  }
  return data;
}


module.exports = readDefaultConfig();
