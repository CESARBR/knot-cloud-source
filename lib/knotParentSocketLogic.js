var _ = require('lodash');
var whoAmI = require('./whoAmI');
var config = require('../config');
var getData = require('./getData');
var logData = require('./logData');
var logEvent = require('./logEvent');
var getEvents = require('./getEvents');
var getDevices = require('./getDevices').getDeviceWithoutFromDevice;
var authDevice = require('./authDevice');
var claimDevice = require('./claimDevice');
var getPublicKey = require('./getPublicKey');
var register = require('./KnotRegister');
var updateFromClient = require('./updateFromClient');
var createActivity = require('./createActivity');
var debug = require('debug')('meshblu:protocol:socketLogic');
var logError = require('./logError');
var SocketLogicThrottler = require('./SocketLogicThrottler');
var saveDataIfAuthorized = require('./saveDataIfAuthorized');
var updateSocketId = require('./updateSocketId');
var knotGatewayManager = require('./knotGatewayManager');
var knotDeviceManager = require('./knotDeviceManager.js');
var MeshbluEventEmitter = require('./MeshbluEventEmitter');

function getActivity(topic, parentSocket, device, toDevice){
  return createActivity(topic, parentSocket.ipAddress, device, toDevice);
}

function getDevice(parentSocket, callback) {
  if(parentSocket.skynetDevice){
    whoAmI(parentSocket.skynetDevice.uuid, true, function(device) {
      return callback(null, device);
    });
  }else{
    return callback(new Error('skynetDevice not found for parentSocket' + parentSocket), null);
  }
}

function getDeviceByUuid(uuid, callback) {
  if(uuid){
    whoAmI(uuid, true, function(device) {
      return callback(null, device);
    });
  }else{
    return callback(new Error('skynetDevice not found'), null);
  }
}

function knotParentSocketLogic (connection){

  var throttler = new SocketLogicThrottler(connection.socket);

  connection.socket.on('getDevices', throttler.throttle(function (data, fn) {
    fn = fn || _.noop
    data = data || {};

    var query = {"owner":data.request.owner};
    getDevices(query, true, function (error, results) {
      results.fromUuid = query.owner;
      logEvent(403, results);
      try {
        fn(results);
      } catch (e) {
        logError(e);
      }
    });
  }));


  connection.socket.on('updateDevices', throttler.throttle(function (data, fn) {
    fn = fn || _.noop
    if (!data) {
      data = {};
    }
    getDeviceByUuid(data.request.uuid, function (err, fromDevice) {
      if (err) { return; }
      updateFromClient(fromDevice, data.request, function (regData) {
        try {
          if(regData.error){
            fn(regData.error)
          }
          else{
            fn(regData);
          }
         
        } catch (error) {
          logError(error);
        }
      });
    });
  }));

  connection.socket.on('createDevices', throttler.throttle(function (data, fn) {
    fn = fn || _.noop
    debug('register', data, fn);
    data = data.request || {};
    originalData = _.cloneDeep(data);
    debug('socketLogic:registering');
    knotDeviceManager.createUUID(function (uuid) {
      register(data, function (error, device) {

        try {
          if(error){
            fn(error);
          }
          else{
            fn(device);
          }
        } catch (e) {
          logError(e);
        }
      }, { "uuid": uuid });
    });
  }
  ));

  connection.socket.on('reconnect', throttler.throttle(function (data, fn) {
    if (knotGatewayManager.getDeviceMappings() && knotGatewayManager.getDeviceMappings().length > 0) {
      connection.socket.emit('updateGatewayDeviceMapping', { "gatewayUUID": config.uuid, "mappings": knotGatewayManager.getDeviceMappings() });
    }
  }));
};


module.exports = knotParentSocketLogic;
