'use strict';

var skynetClient = require('meshblu'); //skynet npm client
var knotParentSocketLogic = require('./knotParentSocketLogic');

var conn = null;

module.exports.openParentConnection = function (config) {
  if (!config.uuid) {
    return;
  }

  conn = skynetClient.createConnection(config);
  conn.on('notReady', function (data) {
    console.log('Failed authentication to parent cloud', data);
  });

  conn.on('ready', function (data) {
    console.log('UUID authenticated for parent cloud connection.', data);
  });

  conn.on('connect', function (data) {
    knotParentSocketLogic(this);
  });

  return conn;
}

module.exports.getParentConnection = function () {
  return conn;
}

module.exports.buildParentData = function (fromDevice,config,data,callback) {
  callback({
            "uuid": config.uuid,
            "source": fromDevice.uuid,
            "data": data
          });
}
