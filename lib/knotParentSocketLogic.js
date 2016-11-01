var _ = require('lodash');
var whoAmI = require('./whoAmI');
var config = require('../config');
var getData = require('./getData');
var logData = require('./logData');
var logEvent = require('./logEvent');
var getEvents = require('./getEvents');
var getDevices = require('./getDevices');
var authDevice = require('./authDevice');
var claimDevice = require('./claimDevice');
var getPublicKey = require('./getPublicKey');
var createActivity = require('./createActivity');
var debug = require('debug')('meshblu:protocol:socketLogic');
var logError = require('./logError');
var SocketLogicThrottler = require('./SocketLogicThrottler');
var saveDataIfAuthorized = require('./saveDataIfAuthorized');
var updateSocketId = require('./updateSocketId');

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

function knotParentSocketLogic (connection){
  
  var throttler = new SocketLogicThrottler(connection.socket);
  
  connection.socket.on('getDevices', throttler.throttle(function (data, fn) {
    fn = fn || _.noop

    if(!data || (typeof data != 'object')){
      data = {};
    }
    
    updateSocketId(data, function(auth){
        if (auth.status != 201){
          return
        }

        connection.socket.skynetDevice = auth.device;

        getDevice(connection.socket, function(err, device){

        if(err){ return; }
        var reqData = data;
        getDevices(device, data, false, function(error, results){
          results.fromUuid = device.uuid;
          results.from = _.pick(device, config.preservedDeviceProperties);
          logEvent(403, results);
          try{
            fn(results);
          } catch (e){
            logError(e);
          }
        });
      });
    });
  }));  
};


module.exports = knotParentSocketLogic;
