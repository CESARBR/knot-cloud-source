var request = require('request');
var gatewaydb = require('database');

// Set the headers
var headers = {
    'Content-Type': 'application/json'
}

// Configure the request
var options = {
    url: 'http://cloudip:port/devices',
    method: 'POST',
    headers: headers
}

var createOwner = function (success) {
    // Start the request
    options.body = {
        "user": "",
        "password": "",
        "type": "userDevice"
    };
    request(options, function (error, response, body) {
        if (error) {
            return;
        }

        if (response.statusCode == 200 && success) {
            success(body);
        }
    })
};

var createGateway = function (body, success) {
    options.body = {
        "owner": body.uuid,
        "type": "gateway"
    };
    request(options, function (error, response, body) {
        if (error) {
            return;
        }

        if (response.statusCode == 200 && success) {
            success(body);
        }
    })
};

var validateUserConfiguration = function(callback) {
    process.stdout.write('Validating user\'s credentials...');

    gatewaydb.user.findOne({}, function(err, user) {
        if (err || !user) {
            if (callback)
                callback();
            return;
        }

        if (!user.uuid) {
            process.stdout.write('Credentials not found, creating one...');

            createOwner(function(response) {
                process.stdout.write('Credentials created, storing in database...');

                gatewaydb.user.findAndModify({
                    query: { _id: user._id },
                    update: { $set: { uuid: response.uuid, token: response.token } }
                }, function(err, user) {
                    if (err) {
                        if (callback)
                            callback();
                        return;
                    }

                    console.log(' done.');
                    validateGatewayConfiguration(user, callback);
                });
            });
        } else {
            console.log(' done.');
            validateGatewayConfiguration(user, callback);
        }
    });
};

var validateGatewayConfiguration = function(user, callback) {
    process.stdout.write('Validating gateway\'s credentials...');

    gatewaydb.configuration.findOne({}, function(err, config) {
        if (err || !config) {
            if (callback)
                callback();
            return;
        }

        if (!config.uuid) {
            process.stdout.write('Credentials not found, creating one...');

            createGateway({ uuid: user.uuid }, function(response) {
                process.stdout.write('Credentials created, storing in database...');

                gatewaydb.configuration.findAndModify({
                    query: { _id: config._id },
                    update: { $set: { uuid: response.uuid, token: response.token } }
                }, function(err, config) {
                    if (err) {
                        if (callback)
                            callback();
                        return;
                    }

                    console.log(' done.');
                    openParentConnection({
                        uuid: config.uuid,
                        token: config.token,
                        server: config.parent_port
                        port: config.parent_ip
                    }, callback);
                });
            });
        } else {
            console.log(' done.');
            openParentConnection({
                uuid: config.uuid,
                token: config.token,
                server: config.parent_port
                port: config.parent_ip
            }, callback);
        }
    });
};

var openParentConnection = function(config, callback) {
    process.stdout.write('Starting parent connection...');
    parentConnection = require('./lib/knotParentConnection').openParentConnection(config);
    console.log(' done.');

    if (callback)
        callback(parentConnection);
};

module.exports.setupUserConfiguration = function(callback) {
    validateUserConfiguration(callback);
};