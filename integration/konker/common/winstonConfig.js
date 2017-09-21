LOGGER = require('winston');
LOGGER.level = 'debug';
LOGGER.remove(LOGGER.transports.Console);
LOGGER.add(LOGGER.transports.Console, {'timestamp':true});
module.exports = () => {}
