var config = require('./../config');
var path = require('path');
var deviceCounterSequenceName = 'deviceCounters';
var deviceIDName = 'deviceID';

if (config.mongo && config.mongo.databaseUrl) {

  var mongojs = require('mongojs');
  var db = mongojs(config.mongo.databaseUrl);
  module.exports = {
    deviceIDName: deviceIDName,
    user: db.collection('user'),
    configuration: db.collection('configuration'),
    devices: db.collection('devices'),
    events: db.collection('events'),
    data: db.collection('data'),
    subscriptions: db.collection('subscriptions'),
    deviceCounters: db.collection('deviceCounters'),
    getNextSequence: function (name,callback) {
      this.deviceCounters.findAndModify({
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
      var deviceCounters = collections.find(function (collection) {
        return collection.name === deviceCounterSequenceName;
      });

      if (!deviceCounters) {
        db.collection('deviceCounters').insert({
          "_id": "deviceID",
          "seq": 0
        });
      }
    }
  });

} else {

  var Datastore = require('nedb');
  var user = new Datastore({
    filename: path.join(__dirname, '/../user.db'),
    autoload: true
  });
  var configuration = new Datastore({
    filename: path.join(__dirname, '/../configuration.db'),
    autoload: true
  });
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
    user: user,
    configuration: configuration,
    devices: devices,
    events: events,
    data: data,
    subscriptions: subscriptions,
    getNextSequence: function (name, callback) {
      callback(Math.floor(Math.random() * 1000 + 1));
    }
  };
}