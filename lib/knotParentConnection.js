'use strict';

var skynetClient = require('meshblu'); //skynet npm client
var config = require('./../config');
var knotParentSocketLogic = require('./knotParentSocketLogic');

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
    config.parentConnection.knotCloudUuid = data.cloud;
    console.log('Parent cloud connection opened.', data);
  });

  conn.on('connect', function (data) {
    console.log('Starting Parent Connection...');
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
