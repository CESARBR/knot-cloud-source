var _      = require('lodash');
var moment = require('moment');
var whoAmI = require('./whoAmI');
var config = require('./../config');
var devices = require('./database').devices;
var getDevices = require('./getDevices').getDeviceByQuery;
var authDevice = require('./authDevice');
var knotUser = require('./knotUser');
var oldUpdateDevice = require('./oldUpdateDevice');

function authUser(query,fn){
    getDevices(query, function (error, results) {
      try {
        fn(results);
      } catch (e) {
        logError(e);
      }
    });
}

module.exports = function(socket, callback) {
  var uuid, token;

  socket = _.clone(socket);

  uuid = socket.uuid;
  delete socket['uuid'];
  token = socket.token;
  delete socket['token'];

  var auto_set_online = socket.auto_set_online !== false;
  delete socket.auto_set_online;
  var unauthorizedResponse = {status: 401, uuid: uuid};
  
  if (_.isUndefined(socket.online) && auto_set_online) {
    socket.online = true;
  }

  if (!uuid && !token) {
    // auto-register device if UUID not provided on authentication
    var registerDevice = require('./KnotRegister');

    socket.autoRegister = true;

    registerDevice(socket, function(error, device){
      if(error) {
        callback(unauthorizedResponse);
        return;
      }
      callback({status: 201, uuid: device.uuid, device: device});
    });
    return;
  }

  if(uuid && !token){
    callback(unauthorizedResponse);
    return;
  }

  var query = { "user.email": uuid, "user.password": token };
  authUser(query, function (result) {
    if (result.devices && result.devices.length > 0) {
      var device = result.devices[0];
      if (device && device.user) {
        uuid = device.user.uuid;
        token = device.user.token;
      }
    }
    authDevice(uuid, token, function (error, device) {
      if (error) {
        callback(unauthorizedResponse);
        return;
      }
      if (!device) {
        callback(unauthorizedResponse);
        return;
      }
      oldUpdateDevice(uuid, socket, function (error, device) {
        if (error) {
          callback(unauthorizedResponse);
          return
        }
        callback({ uuid: uuid, status: 201, device: device });
      });
    });
  });
};
