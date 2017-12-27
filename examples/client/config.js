const config = require('config');
const fs = require('fs');

const filePath = '/etc/knot/gatewayConfig.json'
let data;
if (fs.existsSync(filePath)) {
  data = JSON.parse(fs.readFileSync(filePath, 'utf-8')).cloud;
} else {
  data = config.get('cloud'); // eslint-disable-line global-require
}

module.exports = data;