var _ = require('lodash');
var whoAmI = require('./whoAmI');
var config = require('../config');
var getData = require('./getData');
var logData = require('./logData');
var logEvent = require('./logEvent');
var register = require('./KnotRegister');
var getEvents = require('./getEvents');
var getDevices = require('./getDevices');
var resetToken = require('./resetToken');
var authDevice = require('./authDevice');
var unregister = require('./unregister');
var revokeToken = require('./revokeToken');
var claimDevice = require('./claimDevice');
var getPublicKey = require('./getPublicKey');
var securityImpl = require('./getSecurityImpl');
var createActivity = require('./createActivity');
var updateSocketId = require('./KnotUpdateSocketId');
var updatePresence = require('./updatePresence');
var getSystemStatus = require('./getSystemStatus');
var updateFromClient = require('./updateFromClient');
var generateAndStoreToken = require('./generateAndStoreToken');
var debug = require('debug')('meshblu:protocol:socketLogic');
var logError = require('./logError');
var MessageIOClient = require('./messageIOClient');
var MeshbluEventEmitter = require('./MeshbluEventEmitter');
var SocketLogicThrottler = require('./SocketLogicThrottler');
var saveDataIfAuthorized = require('./saveDataIfAuthorized');
var clearCache = require('./clearCache');
var parentConnection = require('./knotParentConnection').getParentConnection();
var buildParentData = require('./knotParentConnection').buildParentData;
var knotGatewayManager = require('./knotGatewayManager');
var knotDeviceManager = require('./knotDeviceManager');
var knotMessageManager = require('./knotMessageManager');


function getActivity(topic, socket, device, toDevice){
  return createActivity(topic, socket.ipAddress, device, toDevice);
}

function getDevice(socket, callback) {
  if(socket.skynetDevice){
    whoAmI(socket.skynetDevice.uuid, true, function(device) {
      return callback(null, device);
    });
  }else{
    return callback(new Error('skynetDevice not found for socket' + socket), null);
  }
}

function socketLogic (socket, secure, skynet){
  var ipAddress = socket.handshake.headers['x-forwarded-for'] || socket.request.connection._peername.address;
  var throttler = new SocketLogicThrottler(socket);
  var meshbluEventEmitter = new MeshbluEventEmitter(config.uuid, config.forwardEventUuids, skynet.sendMessage);

  socket.ipAddress = ipAddress;
  logEvent(100, {socketid: socket.id, protocol: 'websocket'});

  socket.emit('identify');
  socket.on('identity', throttler.throttle(function (data) {
    socket.auto_set_online = data.auto_set_online !== false;
    if (socket.auto_set_online) {
      data = _.extend({}, data, {
        socketid: socket.id,
        ipAddress: ipAddress,
        secure: secure
      });
    }

    if(!data.protocol){
      data.protocol = 'websocket';
    }

    updateSocketId(data, function(auth){
      if (auth.status != 201){
        meshbluEventEmitter.emit('identity-error', {request: {uuid: data.uuid}, error: 'Device not found or token not valid'});
        socket.emit('notReady', {api: 'connect', status: auth.status, uuid: data.uuid});
        return
      }

      socket.skynetDevice = auth.device;

      var readyMessage = {
        api: 'connect',
        status: auth.status,
        socketid: socket.id,
        uuid: auth.device.uuid,
        cloud: config.uuid,
        token: data.token
      };

      if (data.uuid !== auth.device.uuid) {
        readyMessage.token = auth.device.token;
      }

      socket.emit('ready', readyMessage);
      
      if (config.knotInstanceType === 'cloud') {
        knotGatewayManager.addGateway(socket, function (result) {
          if (result)
            console.log("Gateway " + socket.skynetDevice.uuid + " connected");
        });
      }
      
      if (config.parentConnection.uuid) {
        var mapping = { "thingUUID": socket.skynetDevice.uuid, "gatewayUUID": config.uuid, "mapping": [config.uuid, socket.skynetDevice.uuid] };
        knotGatewayManager.addMapping(mapping, function (err, result) {
          if (err) {
            console.error(err);
          } else if (parentConnection && knotGatewayManager.getDeviceMappings() && knotGatewayManager.getDeviceMappings().length > 0) {
            console.log("Update mapping " + socket.skynetDevice.uuid + " on cloud");
            parentConnection.socket.emit('updateGatewayDeviceMapping', { "gatewayUUID": config.uuid, "mappings": knotGatewayManager.getDeviceMappings() });
          }
        });
      }

      //Announce presence online
      if (socket.auto_set_online) {
        var message = {
          devices: '*',
          topic: 'device-status',
          payload: {
            online: true
          }
        };
        skynet.sendMessage(auth.device, message);
      }

      debug('setting up message bus', socket.id);
      socket.messageIOClient = new MessageIOClient();
      socket.messageIOClient.on('message', function(message){
        debug(socket.id, 'relay message', message, socket.skynetDevice.uuid);
        socket.emit('message', message);
      });

      socket.messageIOClient.on('data', function(message){
        debug(socket.id, 'relay data', message, socket.skynetDevice.uuid);
        socket.emit('data', message);
      });

      socket.messageIOClient.on('config', function(message){
        debug(socket.id, 'relay config', message);
        socket.emit('config', message);
      });

      // Have device join its uuid room name so that others can subscribe to it
      debug(socket.id, 'subscribing to received', auth.device.uuid);
      socket.messageIOClient.subscribe(auth.device.uuid, ['received', 'config', 'data']);

      whoAmI(data.uuid, false, function(results){
        data.auth = auth;
        data.fromUuid = results.uuid;
        data.from = _.pick(results, config.preservedDeviceProperties);
        logEvent(101, data);
        meshbluEventEmitter.emit('identity', {request: {uuid: auth.device.uuid}});
      });
    });
  }));

  socket.on('disconnect', function (data) {
    debug('disconnecting', socket.id);
    if (socket.messageIOClient) {
      socket.messageIOClient.close();
    }
    if (socket.auto_set_online) {
      updatePresence(socket.id, function(){
        if (socket.skynetDevice) {
          var uuid = socket.skynetDevice.uuid;
        }
      });
    }
    // Emit API request from device to room for subscribers
    getDevice(socket, function(err, device){
      //Announce presence offline
      if (socket.auto_set_online) {
        var message = {
          devices: '*',
          topic: 'device-status',
          payload: {online: false}
        };
        skynet.sendMessage(device, message);
      }
      
      if (config.knotInstanceType === 'cloud') {
        knotGatewayManager.removeGateway(socket, function (err, result) {
          if (err) {
            console.error(err);
          } else {
           console.log("Gateway " + socket.skynetDevice.uuid + " disconnected");
          }
       });
      }

      logEvent(102, {api: "disconnect", socketid: socket.id, device: device});
    });
  });

  socket.on('subscribe', throttler.throttle(function(message, fn) {
      fn = fn || _.noop;
      if(!message) {
        return fn({error: "not enough information to subscribe"});
      }
      var requestedSubscriptionTypes = message.types || ['broadcast', 'received', 'sent'];

      if(message.token) {
        authDevice(message.uuid, message.token, function(error, authedDevice) {
          if (!authedDevice || error) {
            return fn({error: error});
          }

          if (!socket.messageIOClient) {
            return fn({error: "socket not initialized"});
          }
          requestedSubscriptionTypes.push('config');
          requestedSubscriptionTypes.push('data');
          socket.messageIOClient.subscribe(message.uuid, requestedSubscriptionTypes, message.topics);
          meshbluEventEmitter.emit('subscribe', {request: _.omit(message, 'token'), fromUuid: authedDevice.uuid});
        });
        return fn({});
      }

      getDevice(socket, function(err, subscribingDevice) {
        skynet.sendActivity(getActivity('subscribe', socket, subscribingDevice));

        if(err) {
          return fn({error: "can't get subscribingDevice"});
        }

        whoAmI(message.uuid, false, function(device) {
          if(device.error){
            return fn(device);
          }

          meshbluEventEmitter.emit('subscribe', {request: message, fromUuid: device.uuid});
          message.toUuid = device.uuid;
          message.to = _.pick(device, config.preservedDeviceProperties);
          logEvent(204, message);

          securityImpl.canReceive(subscribingDevice, device, function(error, permission) {
            if(error) {
              debug('subscribe', 'fromDevice', subscribingDevice, 'toDevice', device, "can't receive");
              return fn({error: "unauthorized access"});
            }

            var authorizedSubscriptionTypes = [];
            var subscriptionTypes;

            if (permission) {
              authorizedSubscriptionTypes.push('broadcast');
            }

            securityImpl.canReceiveAs(subscribingDevice, device, function(error, permission){
              if(error) {
                debug('subscribe', 'fromDevice', subscribingDevice, 'toDevice', device, "can't receive");
                return fn({error: "unauthorized access"});
              }

              if (permission) {
                authorizedSubscriptionTypes.push('broadcast');
                authorizedSubscriptionTypes.push('received');
                authorizedSubscriptionTypes.push('sent');
                authorizedSubscriptionTypes.push('config');
                authorizedSubscriptionTypes.push('data');
              }

              requestedSubscriptionTypes = requestedSubscriptionTypes || authorizedSubscriptionTypes;
              subscriptionTypes = _.intersection(requestedSubscriptionTypes, authorizedSubscriptionTypes);
              subscriptionTypes = _.union(subscriptionTypes, ['config', 'data']);

              if (!socket.messageIOClient) {
                return fn({error: "socket not initialized"});
              }
              socket.messageIOClient.subscribe(message.uuid, subscriptionTypes, message.topics);
              fn({"api": "subscribe", "socketid": socket.id, "toUuid": message.uuid, "result": true});
            });
          });
        });
      });
  }));

  socket.on('unsubscribe', throttler.throttle(function(data, fn) {
    fn = fn || _.noop;

    if (!socket.messageIOClient) {
      return fn({error: "socket not initialized"});
    }

    socket.messageIOClient.unsubscribe(data.uuid, data.types);

    getDevice(socket, function(err, device){
      skynet.sendActivity(getActivity('unsubscribe', socket, device));
      if(err){ return; }
      data.fromUuid = device.uuid;
      data.from = _.pick(device, config.preservedDeviceProperties);
      logEvent(205, data);
    });
    try{
      fn({"api": "unsubscribe", "uuid": data.uuid});
    } catch (e){
      logError(e);
    }
  }));

  // APIs
  socket.on('status', throttler.throttle(function (fn) {
    fn = fn || _.noop

    getDevice(socket, function(err, device){
      skynet.sendActivity(getActivity('status', socket, device));
      if(err){ return; }

      getSystemStatus(function(results){

        results.fromUuid = device.uuid;
        results.from = _.pick(device, config.preservedDeviceProperties);
        logEvent(200, results);
        try{
          fn(results);
        } catch (e){
          logError(e);
        }
      });
    });
  }));

  socket.on('device', throttler.throttle(function (data, fn) {
    fn = fn || _.noop

    if(!data || (typeof data != 'object')){
      data = {};
    }

    getDevice(socket, function(err, device){
      skynet.sendActivity(getActivity('device', socket, device));
      if(err){ return; }
      var reqData = data;
      getDevices(device, data, false, function(error, results){
        var msg = {
          fromUuid : device.uuid,
          from : device,
          device: _.first(results.devices)
        };
        logEvent(403, msg);

        if(results.error) {
          meshbluEventEmitter.emit('devices-error', {request: data, error: results.error.message, fromUuid: device.uuid});
          return fn({error: results.error});
        } else {
          meshbluEventEmitter.emit('devices', {request: data, fromUuid: device.uuid});
        }

        try{
          fn(msg);
        } catch (e){
          logError(e);
        }
      });
    });
  }));

  socket.on('devices', throttler.throttle(function (data, fn) {
    fn = fn || _.noop
    if (data.gateways && socket.skynetDevice && socket.skynetDevice.uuid) {
      data.query = { "owner": socket.skynetDevice.uuid, "gateways": data.gateways };
      knotGatewayManager.getGatewayDevices(data, function (device) {
        fn(device);
      });
    }
    else {
      getDevice(socket, function (err, device) {
        skynet.sendActivity(getActivity('devices', socket, device));
        if (err) { return; }
        var reqData = data;
        getDevices(device, data, false, function (error, results) {
          results.fromUuid = device.uuid;
          results.from = _.pick(device, config.preservedDeviceProperties);
          logEvent(403, results);

          if (results.error) {
            meshbluEventEmitter.emit('devices-error', { request: data, error: results.error.message, fromUuid: device.uuid });
          } else {
            meshbluEventEmitter.emit('devices', { request: data, fromUuid: device.uuid });
          }

          try {
            fn(results);
          } catch (e) {
            logError(e);
          }
        });
      });
    }
  }));

  socket.on('mydevices', throttler.throttle(function (data, fn) {
    fn = fn || _.noop
    data = data || {};

    getDevice(socket, function(err, device){
      skynet.sendActivity(getActivity('mydevices', socket, device));
      if(err){ return; }
      data.owner = device.uuid;
      getDevices(device, data, true, function(error, results){
        results.fromUuid = device.uuid;
        results.from = _.pick(device, config.preservedDeviceProperties);
        logEvent(403, results);

        if(results.error){
          meshbluEventEmitter.emit('devices-error', {request: data, error: results.error.message, fromUuid: device.uuid});
        } else {
          meshbluEventEmitter.emit('devices', {request: data, fromUuid: device.uuid});
        }

        try{
          fn(results);
        } catch (e){
          logError(e);
        }
      });
    });
  }));
  

  socket.on('claimdevice', throttler.throttle(function (data, fn) {
    fn = fn || _.noop

    if(!data || (typeof data != 'object')){
      data = {};
    }
    // Emit API request from device to room for subscribers
    getDevice(socket, function(err, device){
      skynet.sendActivity(getActivity('claimdevice', socket, device));
      if(err){ return; }
      claimDevice(device, data, function(err, results){
        logEvent(403, {error: (err && err.message), results: results, fromUuid: device.uuid, from: device});

        if(err){
          meshbluEventEmitter.emit('claimdevice-error', {request: data, error: err.message, fromIp: device.ipAddress, fromUuid: device.uuid});
        } else {
          meshbluEventEmitter.emit('claimdevice', {request: data, fromIp: device.ipAddress, fromUuid: device.uuid});
        }

        try{
          fn({error: (err && err.message), results: results});
        } catch (e){
          logError(e);
        }
      });
    });
  }));

  socket.on('whoami', throttler.throttle(function (data, fn) {
    fn = fn || _.noop

    getDevice(socket, function(err, device){
      skynet.sendActivity(getActivity('whoami', socket, device));
      if(err){ return; }

      meshbluEventEmitter.emit('whoami', {request: data, fromUuid: device.uuid});
      try{
        fn(device);
      } catch (e){
        logError(e);
      }
    });
  }));


  socket.on('register', throttler.throttle(function (data, fn) {
    fn = fn || _.noop
    debug('register', data, fn);
    data = data || {};
    originalData = _.cloneDeep(data);

    if (data.gateway) {
      knotGatewayManager.createGatewayDevices(data, function (device) {
         fn(device);
      });
    }
    else {
      skynet.sendActivity(getActivity('register', socket));
      data.socketid = socket.id;
      data.ipAddress = data.ipAddress || ipAddress;
      debug('socketLogic:registering');
      knotDeviceManager.createUUID(function (uuid) {
        register(data, function (error, device) {
          if (error) {
            meshbluEventEmitter.emit('register-error', { request: _.omit(data, 'socketid'), error: error.message });
            return fn({ error: error });
          } else {
            meshbluEventEmitter.emit('register', { request: _.omit(data, 'socketid') });
          }

          try {
            fn(device);
          } catch (e) {
            logError(e);
          }
        }, { "uuid": uuid });
      });
    }
  }));

  socket.on('update', throttler.throttle(function (data, fn) {
    fn = fn || _.noop
    if (!data) {
      data = {};
    }
    knotGatewayManager.getThingGateway(data.uuid, function (gateway) {
      if (gateway) {
        knotGatewayManager.updateGatewayDevices(gateway,data, function (device) {
          fn(device);
        });
      }
      else {
        getDevice(socket, function (err, fromDevice) {
          skynet.sendActivity(getActivity('update', socket, fromDevice));
          if (err) { return; }
          // Emit API request from device to room for subscribers
          updateFromClient(fromDevice, data, function (regData) {
            var requestLog = { query: { uuid: data.uuid }, params: { $set: data } };

            if (regData && regData.error) {
              meshbluEventEmitter.emit('update-error', { request: requestLog, error: regData.error.message, fromUuid: fromDevice.uuid });
            } else {
              meshbluEventEmitter.emit('update', { request: requestLog, fromUuid: fromDevice.uuid });
            }

            try {
              fn(regData);
            } catch (error) {
              logError(error);
            }
          });
        });
      }
    })
  }));

  socket.on('unregister', throttler.throttle(function (data, fn) {
    fn = fn || _.noop
    if(!data){
      data = {};
    }
    // Emit API request from device to room for subscribers
    getDevice(socket, function(err, fromDevice){
      if(err){ return; }
      var reqData = data;
      skynet.sendActivity(getActivity('unregister', socket, fromDevice));
      unregister(fromDevice, data.uuid, data.token, skynet.emitToClient, function(results){
        if(results == null || results == undefined){
          results = {};
        }
        results.fromUuid = fromDevice.uuid;
        results.from = _.pick(fromDevice, config.preservedDeviceProperties);
        logEvent(402, results);

        if(_.isString(results)){
          meshbluEventEmitter.emit('unregister-error', {request: data, fromUuid: fromDevice.uuid, error: results});
          return fn({error: results});
        } else {
          meshbluEventEmitter.emit('unregister', {request: data, fromUuid: fromDevice.uuid});
        }

        try{
          fn(results);
        } catch (e){
          logError(e);
        }
      });
    });
  }));

  socket.on('events', throttler.throttle(function(data, fn) {
    fn = fn || _.noop
    authDevice(data.uuid, data.token, function(error, authedDevice){
      if(!authedDevice){
          var results = {"api": "events", "result": false};

          try{
            fn(results);
          } catch (e){
            logError(e);
          }
          return;
      }

      // Emit API request from device to room for subscribers
      getDevice(socket, function(err, device){
        skynet.sendActivity(getActivity('events', socket, device));
        if(err){ return; }
        var reqData = data;
        reqData.api = "events";

        getEvents(data.uuid, function(results){
          try{
            fn(results);
          } catch (e){
            logError(e);
          }
          return;
        });
      });
    });
  }));

  socket.on('authenticate', throttler.throttle(function(data, fn) {
    fn = fn || _.noop
    skynet.sendActivity(getActivity('authenticate', socket));

    authDevice(data.uuid, data.token, function(error, authedDevice){
      var results;
      if (!authedDevice) {
        try{
          fn({"uuid": data.uuid, "authentication": false});
        } catch (e){
          logError(e);
        }
        return;
      }

      results = {"uuid": data.uuid, "authentication": true};

      data = _.extend({}, data, {
        socketid: socket.id,
        ipAddress: ipAddress,
        secure: secure,
        online: true
      });

      if(!data.protocol){
        data.protocol = "websocket";
      }

      updateSocketId(data, function() {
        socket.emit('ready', {"api": "connect", "status": 201, "socketid": socket.id, "uuid": data.uuid});
        socket.join(data.uuid);

        try{
          fn(results);
        } catch (e){
          logError(e);
        }
      });

      whoAmI(data.uuid, false, function(check){
        results.toUuid = check.uuid;
        results.to = check;
        logEvent(102, results);
      });
    });
  }));

  socket.on('data', throttler.throttle(function(data, fn) {
    fn = fn || _.noop

    if(data.skynetDevice){
      socket.skynetDevice = data.skynetDevice;
    }

    getDevice(socket, function(err, fromDevice){
      if(err){ return; }
      skynet.sendActivity(getActivity('data', socket, fromDevice));
      saveDataIfAuthorized(skynet.sendMessage, fromDevice, data.uuid, data, function(error){
        if(error){
          meshbluEventEmitter.emit('data-error', {request: data, error: error.message, fromUuid: fromDevice.uuid});
          return fn({error: error});
        } else {
          meshbluEventEmitter.emit('data', {request: data, fromUuid: fromDevice.uuid});
        }

        if (parentConnection) {
          buildParentData(fromDevice,config,data,function(parentData){
             parentConnection.socket.emit('data', parentData);
          });
        }

        try{
          fn();
        } catch (e){
          logError(e);
        }
      });
    });
  }));

  socket.on('getdata', throttler.throttle(function(data, fn) {
    fn = fn || _.noop

    skynet.sendActivity(getActivity('getdata', socket));
    authDevice(data.uuid, data.token, function(error, authedDevice){
      if(!authedDevice) {
        var results = {"api": "getdata", "result": false};

        try{
          fn(results);
        } catch (e){
          logError(e);
        }
        return;
      }

      if(!data || (typeof data != 'object')){
        data = {};
      }
      data.params = {};
      data.query = {};

      if (data.target) {
        if (data.target != "*")
          data.params.uuid = data.target;
      }
      else {
        data.params.uuid = data.uuid;
      }
     
      data.query.start = data.start; // time to start from
      data.query.finish = data.finish; // time to end
      data.query.limit = data.limit; // 0 bypasses the limit

      meshbluEventEmitter.emit('subscribe', {request: {uuid: data.uuid, type: 'data'}, fromUuid: socket.skynetDevice.uuid});

      getData(data, function(results){
        if (results) {
          results.fromUuid = socket.skynetDevice.uuid;
        }

        try{
          fn(results);
        } catch (e){
          logError(e);
        }
      });
    });
  }));

  socket.on('messageAck', throttler.throttle(function (data) {
    getDevice(socket, function(err, fromDevice){
      skynet.sendActivity(getActivity('messageAck', socket, fromDevice));
      if(fromDevice){
        whoAmI(data.devices, false, function(check){
          data.fromUuid = fromDevice.uuid;

          if(check.error){
            return;
          }
          securityImpl.canSend(fromDevice, check, function(error, permission){
            if(error || !permission){
              debug('messageAck', 'fromDevice', fromDevice, 'toDevice', check, "can't send");
              return;
            }
            skynet.emitToClient('messageAck', check, data);
          });
        });
      }
    });
  }));

  socket.on('tb', throttler.throttle(function (message) {
    if(!message){
      return;
    }

    message = message.toString();

    // Broadcast to room for pubsub
    getDevice(socket, function(err, fromDevice){
      //skynet.sendActivity(getActivity('tb', socket, fromDevice));
      if(fromDevice){
        skynet.sendMessage(fromDevice, {payload: message}, 'tb');
      }
    });
  }));

  socket.on('message', throttler.throttle(function (message, fn) {
    fn = fn || _.noop
    if (typeof message !== 'object' || (_.isEmpty(message.devices) && !message.target)) { return fn({ error: 'Invalid Message Format' }); }
    getDevice(socket, function (err, fromDevice) {
      if (fromDevice) {
        if (message.target && !message.forwarded) {
          knotMessageManager.routeMessage(message, function (routed) {
            meshbluEventEmitter.emit('message', { request: routed, fromUuid: fromDevice.uuid });
            skynet.sendMessage(fromDevice, routed);
            fn();
          });
        }
        else {
          meshbluEventEmitter.emit('message', { request: message, fromUuid: fromDevice.uuid });
          skynet.sendMessage(fromDevice, message);
          fn();
        }
      }
    });
  }));

  socket.on('getPublicKey', throttler.throttle(function(uuid, fn){
    getPublicKey(uuid, function(error, publicKey){

      if(error){
        meshbluEventEmitter.emit('getpublickey-error', {request: {uuid: uuid}, error: error.message});
      } else {
        meshbluEventEmitter.emit('getpublickey', {request: {uuid: uuid}});
      }

      try{
        fn(error, publicKey);
      } catch (e){
        logError(e);
      }
    });
  }));

  socket.on('resetToken', throttler.throttle(function(message, fn){
    fn = fn || _.noop
    getDevice(socket, function(err, fromDevice){
      if(err){ return; }

      resetToken(fromDevice, message.uuid, skynet.emitToClient, function(error, token){
        if(error) {
          meshbluEventEmitter.emit('resettoken-error', {request: {uuid: message.uuid}, error: error, fromUuid: fromDevice.uuid});
          return fn({error: error});
        }
        meshbluEventEmitter.emit('resettoken', {request: {uuid: message.uuid}, fromUuid: fromDevice.uuid});
        fn({uuid: message.uuid, token: token});
      });
    });
  }));

  socket.on('generateAndStoreToken', throttler.throttle(function(message, fn){
    getDevice(socket, function(err, fromDevice){
      if(err){ return logError(err); }
      generateAndStoreToken(fromDevice, message, function(error, result){
        if(error) {
          meshbluEventEmitter.emit('generatetoken-error', {request: {uuid: message.uuid}, error: error.message, fromUuid: fromDevice.uuid});

          return fn({error: error.message});
        }
        meshbluEventEmitter.emit('generatetoken', {request: {uuid: message.uuid}, fromUuid: fromDevice.uuid});
        var tokenOptions = {uuid: message.uuid, token: result.token};
        if(message.tag){
          tokenOptions.tag = message.tag;
        }
        fn(tokenOptions);
      });
    });
  }));

  socket.on('revokeToken', throttler.throttle(function(message, fn){
    getDevice(socket, function(err, fromDevice){
      if(err){ return logError(err); }
      revokeToken(fromDevice, message.uuid, message.token, function(error, result){
        if(error) {
          meshbluEventEmitter.emit('revoketoken-error', {request: {uuid: message.uuid}, error: error.message, fromUuid: fromDevice.uuid});
          return fn({error: error});
        }
        meshbluEventEmitter.emit('revoketoken', {request: {uuid: message.uuid}, fromUuid: fromDevice.uuid});
        fn({uuid: message.uuid});
      });
    });
  }));

  socket.on('addDeviceMapping', throttler.throttle(function(data, fn){
    console.log("map: " + data.thingUUID);
    knotGatewayManager.addMapping(data,function(err, result){
      if (err) {
        console.error(err);
      } else {
        console.log(data.thingUUID + " thing mapping added");
      }
    });
  }));

  socket.on('updateGatewayDeviceMapping', throttler.throttle(function(data, fn){
    knotGatewayManager.updateGatewayDeviceMapping(data,function(err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log(data.gatewayUUID + " gateway mapping updated");
      }
    });
  }));

}

module.exports = socketLogic;
