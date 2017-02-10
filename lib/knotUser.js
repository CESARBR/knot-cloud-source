var Devices = require('./database').devices;

var getUserByEmail = function getUserByEmail (email, done) {
  Devices.findOne({ 'user.email': email }, function(err, user) {
    if (err) {
      done(err);
      return;
    }

    done(null, user);
  });
};

module.exports = {
  getUserByEmail: getUserByEmail
};
