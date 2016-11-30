'use strict';

var getDevice = require('./getDevice');
var devices = require('./database').devices;

var gateways = [];
var gatewayDeviceMap = [];

module.exports.addMapping = function (data, callback) {
    if (data.thingUUID && data.gatewayUUID && data.mapping) {
         gatewayDeviceMap.findIndex(function (element, index, array) {
            if (element.thingUUID === data.thingUUID) {
                gatewayDeviceMap.splice(index, 1);
            }
        });
        gatewayDeviceMap.push(data);
        callback(data.thingUUID + " thing mapping added");
    }
}

module.exports.updateGatewayDeviceMapping = function(data, callback) {
    if (data && data.gatewayUUID && data.mappings) {
        gatewayDeviceMap.findIndex(function (element, index, array) {
            if (element.gatewayUUID === data.gatewayUUID) {
                gatewayDeviceMap.splice(index, 1);
                console.log(element.gatewayUUID + " map removed");
            }
        });

        data.mappings.findIndex(function (element, index, array) {
            gatewayDeviceMap.push(element);
        });

        callback(data.gatewayUUID + " gateway mapping updated");
    }
}

module.exports.getMapping = function (uuid, callback) {
    var mapping = null;
    if (uuid) {
        gatewayDeviceMap.findIndex(function (element, index, array) {
            if (element.thingUUID === uuid) {
                mapping = element.mapping;
                return;
            }
        });
    }
    callback(mapping)
}

module.exports.removeMapping = function (uuid, callback) {
    if (uuid) {
        gatewayDeviceMap.findIndex(function (element, index, array) {
            if (element.thingUUID === uuid) {
                gatewayDeviceMap.splice(index, 1);
                callback(uuid + " thing mapping removed");
            }
        });
    }
}

module.exports.addGateway = function (socket, callback) {
    if (socket.skynetDevice) {
        getDevice(socket.skynetDevice.uuid, function (err, device) {
            if (err) { callback(null); }
            var gateway = device && device.type && device.type === "gateway";
            if (gateway)
                gateways.push({
                    gatewaySocket: socket,
                    gatewayDevice: device
                });
            callback(gateway);
        });
    }
}

module.exports.removeGateway = function (socket, callback) {
    if (gateways && gateways.length > 0 && socket.skynetDevice) {
        gateways.findIndex(function (element, index, array) {
            if (element.gatewaySocket.id === socket.id) {
                gateways.splice(index, 1);
                 if (callback)
                  callback();
            }
        });
    }
}

module.exports.getDeviceMappings = function(){
    return gatewayDeviceMap;
}

module.exports.gateways = gateways;