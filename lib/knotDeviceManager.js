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
        getID(database.deviceIDName, function (result) {
            var id = (paddingValue + result).slice(-paddingValue.length)
            callback(config.parentConnection.uuid.slice(0, config.parentConnection.uuid.length - 4) + id);
        });
    } else {
        var v4 = nodeUUID.v4();
        callback(v4.slice(0, v4.length - 4) + paddingValue);
    }
}