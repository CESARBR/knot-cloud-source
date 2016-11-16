'use strict';

var getDevice = require('./getDevice');
var devices = require('./database').devices;

var gateways = [];

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
            }
        });
    }
    if (callback)
        callback();
}


module.exports.gateways = gateways;