'use strict';
var config = require('./../config');
var knotGatewayManager = require('./knotGatewayManager');
var whoAmI = require('./whoAmI')

module.exports.routeMessage = function (message, callback) {
    knotGatewayManager.getMapping(message.target, function (route) {
        if (route) {
            message.forwarded = true;
            message.devices = route;
            callback(message);
        }
        else {
            whoAmI(message.target, true, function (result) {
                if (result.uuid && result.error === null) {
                    message.forwarded = true;
                    message.devices = [result.uuid];
                    callback(message);
                }
                else if (config.parentConnection.knotCloudUuid) {
                    message.forwarded = true;
                    message.devices = [config.parentConnection.knotCloudUuid, message.target];
                    callback(message);
                }
                else{
                    callback(null);
                }
            });
        }
    });
}
