'use strict';
var config = require('./../config');
var getDevice = require('./getDevice');

var gateways = [];
var gatewayDeviceMap = [];

function isGateway(device) {
    return device.type === "gateway";
}

function getGatewaysByUUIDs(uuids) {
    if (uuids[0] === '*') {
        return gateways;
    }

    return gateways.filter(function (gateway) {
        return uuids.findIndex(function (uuid) {
            return uuid === gateway.gatewayDevice.uuid;
        }) !== -1;
    });
}

function findGatewayByUUId(uuid,fn){
    gateways.findIndex(function (element, index, array) {
        if (element && element.gatewayDevice.uuid === uuid) {
           var target = gateways[index];
           fn(target);
        }
    });
}

function findMappingByThingUUId(uuid,fn){
    gatewayDeviceMap.findIndex(function (element, index, array) {
        if (element.thingUUID === uuid) {
           var target = gatewayDeviceMap[index];
           fn(target);
        }
    });
}

function removeMapping(uuid, callback) {
    var mapping = null;
    var mapIndex = gatewayDeviceMap.findIndex(function (element) {
        return element.thingUUID === uuid;
    });
    if (mapIndex >= 0) {
        mapping = gatewayDeviceMap.splice(mapIndex, 1);
    }
    callback(null, mapping);
}

module.exports.getThingGateway = function(uuid,fn){
    var endString = uuid.substr(uuid.length - 4, 4);
    var stringBegin = uuid.substr(0, uuid.length - 4);
    if(gateways && gateways.length > 0 && endString !== "0000"){
        var gatewayUUID = stringBegin + "0000";
        findGatewayByUUId(gatewayUUID,function(gateway){
            fn(gateway);
        });
    }
    else{
        fn(null);
    }
}

module.exports.addMapping = function (data, callback) {
    var mapping = null;
    if (data.thingUUID && data.gatewayUUID && data.mapping) {
        removeMapping(data.thingUUID, function onRemoved(err, mapping) {
            if (!err) {
                gatewayDeviceMap.push(data);
            }

            if (callback) {
                callback(err);
            }
        });
    } else {
        if (callback) {
            callback(new Error('Invalid argument'));
        }
    }
}
module.exports.updateGatewayDeviceMapping = function(data, callback) {
    if (data && data.gatewayUUID && data.mappings) {
        var mapIndex = gatewayDeviceMap.findIndex(function (element) {
            return element.gatewayUUID === data.gatewayUUID;
        });
        if (mapIndex >= 0) {
            gatewayDeviceMap.splice(mapIndex, 1);
        }
        gatewayDeviceMap = gatewayDeviceMap.concat(data.mappings);

        if (callback) {
            callback(null);
        }
    } else {
        if (callback) {
            callback(new Error('Invalid argument'));
        }
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

module.exports.addGateway = function (socket, callback) {
    if (socket.skynetDevice) {
        getDevice(socket.skynetDevice.uuid, function (err, device) {
            if (err) { callback(null); }
            var gateway = device && device.type && isGateway(device);
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
    var gateway = null;
    if (gateways && gateways.length > 0 && socket.skynetDevice) {
        var removeIndex = gateways.findIndex(function (element) {
            return element.gatewaySocket.id === socket.id;
        });
        if (removeIndex >= 0) {
            gateway = gateways.splice(removeIndex, 1);
        }

        if (callback) {
            callback(null, gateway);
        }
    } else {
        if (callback) {
            callback(new Error('Invalid argument'));
        }
    }
}

module.exports.getDeviceMappings = function(){
    return gatewayDeviceMap;
}

module.exports.getGatewayDevices = function (data, fn) {
    var result = [];
    var selectedGateways;
    var remaining;

    if (!(data.query.gateways instanceof Array)) {
        fn({ error: { message: 'The gateway query filter must be an array containing \'*\' or a list of UUIDs' }});
        return;
    }

    if (!gateways || gateways.length === 0) {
        fn([]);
        return;
    }

    selectedGateways = getGatewaysByUUIDs(data.query.gateways);
    remaining = selectedGateways.length;
    selectedGateways.forEach(function (gateway) {
        var query = { request: data.query, fromUuid: gateway.gatewayDevice.uuid };
        gateway.gatewaySocket.emit('getDevices', query, function (getDevicesResult) {
            remaining--;
            if (remaining < 0) {
                // Some error occurred, ignore the response
                return;
            }

            if (getDevicesResult.error && getDevicesResult.error.code !== 404) {
                remaining = 0;
                result = getDevicesResult;
            } else if (getDevicesResult.devices) {
                result = result.concat(getDevicesResult.devices);
            }

            if (remaining === 0) {
                fn(result);
            }
        });
    });
}

module.exports.updateGatewayDevices = function (gateway, data, fn) {
    if (gateway) {
        gateway.gatewaySocket.emit('updateDevices', { request: data, fromUuid: gateway.gatewayDevice.uuid },
            function (result) {
                fn(result);
            });
    }
}

module.exports.createGatewayDevices = function (data,fn) {
    findGatewayByUUId(data.gateway, function (gateway) {
        if (gateway) {
            gateway.gatewaySocket.emit('createDevices', { request: data.body, fromUuid: gateway.gatewayDevice.uuid },
                function (result) {
                    fn(result);
                });
        }
        else{
             fn({"error":"gateway not found"});
        }

    });
}

module.exports.gateways = gateways;