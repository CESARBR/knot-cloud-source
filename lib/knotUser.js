'use strict';
var getDevices = require("./getDevices").getDeviceByQuery;
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = 'd6F3Efeq';

var getUserByEmail = function getUserByEmail (email, done) {
  var query = { "user.email": email };
  getDevices(query, function(err, result) {
    if (err) {
      done(err);
      return;
    }

    done(null, result.devices);
  });
};

function encrypt(text) {
  var cipher = crypto.createCipher(algorithm, password)
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text) {
  var decipher = crypto.createDecipher(algorithm, password)
  var dec = decipher.update(text, 'hex', 'utf8')
  dec += decipher.final('utf8');
  return dec;
}

var encryptDevice = function encryptDevice(device) {
  if (device.user) {
    device.user.uuid = encrypt(device.uuid);
    device.user.token = encrypt(device.token);
  }
}

var decryptDevice = function decryptDevice(device) {
  if (device.user) {
    device.user.uuid = decrypt(device.user.uuid);
    device.user.token = decrypt(device.user.token);
  }
}

module.exports = {
  getUserByEmail: getUserByEmail,
  encryptDevice: encryptDevice,
  decryptDevice: decryptDevice
};
