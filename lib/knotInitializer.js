var request = require('request');
var gatewaydb = require('knotGatewayDatabase');


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
        if (error) {} else if (response.statusCode == 200) {
            gatewaydb.saveUserDevice(body, function (result) {
                if (success)
                    success(body);
            });
        }
    })
};

var createGateway = function (body, success) {
    options.body = {
        "owner": body.uuid,
        "type": "gateway"
    };
    request(options, function (error, response, body) {
        if (error) {} else if (response.statusCode == 200) {}
    })
};

var setupUserConfiguration = function (data) {

}