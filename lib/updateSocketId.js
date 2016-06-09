var _      = require('lodash');
var moment = require('moment');
var whoAmI = require('./whoAmI');
var config = require('./../config');
var devices = require('./database').devices;
var authDevice = require('./authDevice');
var oldUpdateDevice = require('./oldUpdateDevice');

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
    var registerDevice = require('./register');

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

  authDevice(uuid, token, function(error, device) {
    if(error) {
      callback(unauthorizedResponse);
      return;
    }

    if (!device) {
      callback(unauthorizedResponse);
      return;
    }

    oldUpdateDevice(uuid, socket, function(error, device) {
      if(error) {
        callback(unauthorizedResponse);
        return
      }

      callback({uuid: uuid, status: 201, device: device});
    });
  });
};
