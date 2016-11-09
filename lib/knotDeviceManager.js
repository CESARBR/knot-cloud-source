'use strict';

var config = require('./../config');
var database = require('./database');
var nodeUUID = require('node-uuid');
var paddingValue = "0000";

function getID(deviceIDName, callback) {
    database.getNextSequence(deviceIDName, function (result) {
        callback(result);
    });
}

module.exports.createUUID = function (callback, errorCallback) {
    if (config.parentConnection && config.parentConnection.uuid) {
        var position = config.parentConnection.uuid.lastIndexOf(paddingValue);
        if (position != -1) {
            getID(database.deviceIDName, function (result) {
                var id = (paddingValue + result).slice(-paddingValue.length)
                callback(config.parentConnection.uuid.substr(0, position) + id);
            });
        }
    } else {
        callback(nodeUUID.v4() + "-" + paddingValue);
    }
}