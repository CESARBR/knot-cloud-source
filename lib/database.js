var config = require('./../config');
var path = require('path');
var deviceCounterSequenceName = 'deviceCounters';
var deviceIDName = 'deviceID';

if (config.mongo && config.mongo.databaseUrl) {

  var mongojs = require('mongojs');
  var db = mongojs(
    config.mongo.databaseUrl,
    null,
    {
      socketTimeoutMS: 30000,
      connectTimeoutMS: 60000,
      reconnectTries: Number.MAX_VALUE
    }
  );
  module.exports = {
    deviceIDName: deviceIDName,
    devices: db.collection('devices'),
    events: db.collection('events'),
    data: db.collection('data'),
    subscriptions: db.collection('subscriptions'),
    getNextSequence: function (name,callback) {
      db.deviceCounters.findAndModify({
        query: {
          _id: name
        },
        update: {
          $inc: {
            seq: 1
          }
        },
        new: true
      }, function (result, newID) {
         callback(newID.seq);
      });
    }

  };

  db.on('error', function (err) {
    if (/ECONNREFUSED/.test(err.message) ||
      /no primary server available/.test(err.message)) {
      console.error('FATAL: database error', err);
      process.exit(1);
    }
  });

  db.listCollections(function (err, collections) {
    if (collections) {
      if ((collections.find(function (collection) {
          return collection.name === deviceCounterSequenceName
        })) == undefined) {
        db.deviceCounters.insert({
          "_id": "deviceID",
          "seq": 0
        });
      }

    }
  });

} else {

  var Datastore = require('nedb');
  var devices = new Datastore({
    filename: path.join(__dirname, '/../devices.db'),
    autoload: true
  });
  var events = new Datastore({
    filename: path.join(__dirname, '/../events.db'),
    autoload: true
  });
  var data = new Datastore({
    filename: path.join(__dirname, '/../data.db'),
    autoload: true
  });

  var subscriptions = new Datastore({
    filename: path.join(__dirname, '/../subscriptions.db'),
    autoload: true
  });

  module.exports = {
    devices: devices,
    events: events,
    data: data,
    subscriptions: subscriptions,
    getNextSequence: function (name, callback) {
      callback(Math.floor(Math.random() * 1000 + 1));
    }
  };
}