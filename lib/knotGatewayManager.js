'use strict';

var getDevice = require('./getDevice');
var devices = require('./database').devices;

var gateways = [];

module.exports.isGateway = function (socket, callback) {
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

module.exports.gateways = gateways;