var _ = require('lodash');
var async = require('async');
var debug = require('debug')('meshblu:getDevices');
var config = require('./../config');
var devices = require('./database').devices;
var securityImpl = require('./getSecurityImpl');
var logEvent = require('./logEvent');
var authDevice = require('./authDevice');

function handleError(error, callback) {
  var errorMsg = {
    "error": {
      "message": "Devices not found",
      "code": 404
    }
  };
  logEvent(403, errorMsg);
  callback(errorMsg)
}

function checkToken(uuid, token, callback) {
  authDevice(uuid, token, function(error, result) {
    if (error || !result) {
      return handleError(error, callback);
    }
    logEvent(403, {devices: [result]});
    callback({devices: [result]})
  });
}

function processResults(error, results, callback) {
  if (error || results.length === 0) {
    return handleError(error, callback);
  }

  logEvent(403, {devices: results});
  callback({devices: results});
}

module.exports = function(fromDevice, query, owner, callback) {
  if (query.uuid && query.token) {
    return checkToken(query.uuid, query.token, callback);
  }

  var fetch = {};
  // Loop through parameters to update device
  for (var param in query) {
   fetch[param] = query[param];
   if (query[param] === 'null' || query[param] === ''){
     fetch[param] = { "$exists" : false };
   }

  }
  if (_.isString(query.online)){
    fetch.online = query.online === "true";
  }

  delete fetch.token;
  //sorts newest devices on top
  debug('getDevices start query');
  if(config.mongo && config.mongo.databaseUrl){
    devices.find(fetch, { socketid: false, _id: false, token: false}).maxTimeMS(2000).limit(1000).sort({ _id: -1 }, function(err, devicedata) {
      debug('gotDevices mongo');
      processResults(err, devicedata, callback);
    });
  } else {
    devices.find(fetch, { socketid: false, _id: false, token: false}).limit(1000).sort({ timestamp: -1 }).exec(function(err, devicedata) {
      debug('gotDevices nedb');
      processResults(err, devicedata, callback);
    });
  }
};
