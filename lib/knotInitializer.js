var request = require('request');
var gatewaydb = require('./database');

// Configure the request
var options = {
    url: 'http://%parent_ip%:%parent_port%/devices',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}

var createOwner = function (success) {
    // Start the request
    options.json = {
        "user": "",
        "password": "",
        "type": "userDevice"
    };
    request(options, function (error, response, body) {
        if (error) {
            return;
        }

        if (response.statusCode == 201 && success) {
            success(body);
        }
    })
};

var createGateway = function (body, success) {
    options.json = {
        "owner": body.uuid,
        "type": "gateway"
    };
    request(options, function (error, response, body) {
        if (error) {
            return;
        }

        if (response.statusCode == 201 && success) {
            success(body);
        }
    })
};

var validateUserConfiguration = function(callback) {
    process.stdout.write('Validating user\'s credentials...');

    gatewaydb.user.findOne({}, function(err, user) {
        if (err || !user) {
            process.stdout.write(
                '\nError accessing database... parent connection will not be stabilished.\n'
            );

            if (callback)
                callback();

            return;
        }

        if (!user.uuid) {
            process.stdout.write('\nCredentials not found, creating one...');
            createOwner(function(response) {
                process.stdout.write('\nCredentials created, storing in database...');

                gatewaydb.user.findAndModify({
                    query: { _id: user._id },
                    update: { $set: { uuid: response.uuid, token: response.token } }
                }, function(err, user) {
                    if (err) {
                        process.stdout.write(
                            '\nError updating database... parent connection will not be stabilished.\n'
                        );

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
            process.stdout.write(
                '\nError accessing database... parent connection will not be stabilished.\n'
            );

            if (callback)
                callback();

            return;
        }

        if (!config.uuid) {
            process.stdout.write('\nCredentials not found, creating one...');

            createGateway({ uuid: user.uuid }, function(response) {
                process.stdout.write('\nCredentials created, storing in database...');

                gatewaydb.configuration.findAndModify({
                    query: { _id: config._id },
                    update: { $set: { uuid: response.uuid, token: response.token } }
                }, function(err, config) {
                    if (err) {
                        process.stdout.write(
                            '\nError updating database... parent connection will not be stabilished.\n'
                        );

                        if (callback)
                            callback();

                        return;
                    }

                    console.log(' done.');
                    openParentConnection({
                        uuid: config.uuid,
                        token: config.token,
                        server: config.parent_port,
                        port: config.parent_ip
                    }, callback);
                });
            });
        } else {
            console.log(' done.');
            openParentConnection({
                uuid: config.uuid,
                token: config.token,
                server: config.parent_port,
                port: config.parent_ip
            }, callback);
        }
    });
};

var openParentConnection = function(config, callback) {
    process.stdout.write('Starting parent connection...');
    parentConnection = require('./knotParentConnection').openParentConnection(config);
    console.log(' done.');

    if (callback)
        callback(parentConnection);
};

module.exports.setupUserConfiguration = function(callback) {
    gatewaydb.configuration.findOne({}, function(err, config) {
        if (err || !config || !config.parent_ip || !config.parent_port) {
            if (callback)
                callback();
            return;
        }

        options.url = options.url
            .replace('%parent_ip%', config.parent_ip)
            .replace('%parent_port%', config.parent_port);

        validateUserConfiguration(callback);
    });
};