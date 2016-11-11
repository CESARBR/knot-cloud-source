var Validator = require('jsonschema').Validator;

var configSchema = {
  "type": "array",
  "items": [
    {
      "type": "object",
      "properties": {
        "sensor_id": {
          "type": "number",
          "minimum": 0
        },
        "event_flags": {
          "type": "number",
          "minimum": 0
        },
        "time_sec": {
          "type": "number",
          "minimum": 0
        }, 
        "lower_limit": {
          "type": "number"
        },
        "upper_limit": {
          "type": "number"
        }
      }
    }
  ],
  "minItems": 1,
  "uniqueItems": true
};

module.exports.validateConfig = function (config, callback) {
  v = new Validator();
  var errors = v.validate(config, configSchema).errors
  callback(errors);
};