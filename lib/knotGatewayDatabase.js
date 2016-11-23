var DEVICES_FILE = '/keys.json';
var CONFIGURATION_FILE = '/gatewayConfig.json';
var url = 'mongodb://localhost:27017/gatewayDb';
var mongodb = require('mongodb').MongoClient;


var updateUser = function (db, callback) {
    db.collection('users').insertOne({
    }, function (err, result) {
        console.log(err);
        callback();
    });
};

var gatewayDataBase = function () {
    var saveUserDevice = function (device, success) {
        mongodb.connect(url, function (err, db) {
            updateUser(db, success);
            db.close();
        });
    }
}

module.exports = gatewayDataBase;