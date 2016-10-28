'use strict';

var skynetClient = require('meshblu'); //skynet npm client

var conn = null;

module.exports.openParentConnection = function (config) {
  if (!config.parentConnection.uuid) {
    return;
  }

  conn = skynetClient.createConnection(config.parentConnection);
  conn.on('notReady', function (data) {
    console.log('Failed authentication to parent cloud', data);
  });

  conn.on('ready', function (data) {
    console.log('UUID authenticated for parent cloud connection.', data);
  });

  return conn;
}

module.exports.getParentConnection = function () {
  return conn;
}
