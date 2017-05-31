var _      = require('lodash');
var moment = require('moment');
var whoAmI = require('./whoAmI');
var config = require('./../config');
var devices = require('./database').devices;
var getDevices = require('./getDevices').getDeviceByQuery;
var authDevice = require('./authDevice');
var knotUser = require('./knotUser');
var oldUpdateDevice = require('./oldUpdateDevice');

function authUser(email, password, done){
  knotUser.getUserByEmail(email, function onUser(err, userDevices) {
    var userDevice;
    if (err) {
      done(err);
      return;
    }

    if (!userDevices) {
      done();
      return;
    }

    userDevice = _.find(userDevices, function onUserDevice(userDevice) {
      return knotUser.isPasswordValid(password, userDevice.user.password);
    });

    done(null, userDevice);
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

  authUser(uuid, token, function (err, userDevice) {
    if (err || !userDevice) {
      callback(unauthorizedResponse);
      return;
    }

    // Get actual UUID and token
    uuid = userDevice.user.uuid;
    token = userDevice.user.token;

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
