'use strict';
var getDevices = require("./getDevices").getDeviceByQuery;
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = 'd6F3Efeq';

var ITERATION_COUNT = 5000;
var SALT_LENGTH = 32;
var KEY_LENGTH = 32;
var HASH_ALGORITHM = 'sha256';

var SALT_PASSWORD_HASH_SEPARATOR = '|';
var INPUT_ENCODING = 'utf8';
var OUTPUT_ENCODING = 'hex';

var isPasswordValid = function isPasswordValid(password, hash) {
  var hashSplited = hash.split(SALT_PASSWORD_HASH_SEPARATOR);
  var salt = hashSplited[0];
  var passwordHash = hashSplited[1];

  var saltBuffer = Buffer.from(salt, OUTPUT_ENCODING);
  var passwordBuffer = Buffer.from(password, INPUT_ENCODING);
  var newPasswordHashBuffer = crypto.pbkdf2Sync.pbkdf2Sync(
    passwordBuffer,
    saltBuffer,
    ITERATION_COUNT,
    KEY_LENGTH,
    HASH_ALGORITHM);

  var newPasswordHash = newPasswordHashBuffer.toString(OUTPUT_ENCODING);
  return newPasswordHash === passwordHash;
};

var getUserByEmail = function getUserByEmail (email, done) {
  var query = { 'user.email': email };
  getDevices(query, function(err, result) {
    if (err) {
      done(err);
      return;
    }

    done(null, result.devices);
  });
};

var getUserByToken = function getUserByToken (token, done) {
  var query = { 'user.token': token };
  getDevices(query, function(err, result) {
    if (err) {
      done(err);
      return;
    }

    done(null, result.devices);
  });
};

var getUserByUuid = function getUserByUuid (uuid, done) {
  var query = { 'user.uuid': uuid };
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
  isPasswordValid: isPasswordValid,
  getUserByEmail: getUserByEmail,
  getUserByToken: getUserByToken,  
  getUserByUuid: getUserByUuid,
  encryptDevice: encryptDevice,
  decryptDevice: decryptDevice
};
