'use restrict';

require('./common/winstonConfig')

const axios   = require('axios');
const config  = require('../../config.js');
var dotenv = require('dotenv');
dotenv.load();

let application =    {
    client_id    : '',
    client_secret: '',
    app_name     : ''
}

const plataformTokenMap = new Map();

// **************** INIT ****************

const getToken = (application) => {
    return application.id;
}

const requestToken = (application) => {

    // check in cache first
    if (application === null) {
        return Promise.reject('null application');
    } else if (application.id) {
        return Promise.resolve(application.id);
    } else {
        LOGGER.debug(`[${application.app_name}] Getting access token`);

        let authHost  = `${config.konkerAPI.host}/v1/oauth/token`;
        let authUrl   = `?grant_type=client_credentials&client_id=${application.client_id}&client_secret=${application.client_secret}`;

        return axios
            .get(authHost + authUrl)
            .then(res => {
                try {
                    let token = res.data.access_token;
                    application.id= token;
                    return token;
                } catch(e) {
                    throw e;
                }
            });
    }

}

// **************** SUPPORT FUNCTIONS ****************

const getGetPromise = (path, application) => {

    LOGGER.debug(`[${application.app_name}] GET ${path}`);

    return requestToken(application)
        .then(() => {
            return axios.get(`${config.konkerAPI.host}/v1/${application.app_name}${path}`,
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken(application)}`
                }
            })
            .then(
                res =>  res.data.result
            );
        });

}

const getPutPromise = (path, body, application) => {

    LOGGER.debug(`[${application.app_name}] PUT ${path}`);

    return requestToken(application)
        .then(() => {
            return axios.put(`${config.konkerAPI.host}/v1/${application.app_name}${path}`,
            body,
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken(application)}`
                }
            });
        });

}

const getPostPromise = (path, body, application) => {

    LOGGER.debug(`[${application.app_name}] POST ${path}`);

    return requestToken(application)
        .then(() => {
            return axios.post(`${config.konkerAPI.host}/v1/${application.app_name}${path}`,
            body,
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken(application)}`
                }
            });
        });

}

const getPostApplicationPromise = (path, body, application) => {
    
        LOGGER.debug(`new Application [${application.app_name}] POST ${path}`);
    
        return requestToken(application)
            .then(() => {
                return axios.post(`${config.konkerAPI.host}/v1/${path}`,
                body,
                {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken(application)}`
                    }
                });
            });
    
    }



const getDeletePromise = (path, application) => {

    LOGGER.debug(`[${application.app_name}] DELETE ${path}`);

    return requestToken(application)
        .then(() => {
            return axios.delete(`${config.konkerAPI.host}/v1/${application.app_name}${path}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken(application)}`
                }
            });
        });

}

const removeInvalidChars = (UUID) => {
    return UUID.replace(/\-/g,'')
}


// **************** DEVICES ****************

const createDevicePromise = (gatewayUUID, deviceId) => {
    let path = `/${removeInvalidChars(gatewayUUID)}/devices`;
    let clearedDeviceId=removeInvalidChars(deviceId);
    let body = {
        "id": clearedDeviceId.substring(clearedDeviceId.length - 16),
        "name": "knotthing",
        "description": "knot thing",
        "active": true
    }
    return getPostPromise(path, body, application);
}


const getDevicesPromise = (application) => {
    return getGetPromise('/devices/', application);
}

const getDeviceCredentialsPromise = (application, deviceGuid) => {
    return getGetPromise(`/deviceCredentials/${deviceGuid}`, application);
}

const updateDeviceLocationPromise = (device, location, application) => {
    let path = `/devices/${device.guid}`;
    
    device.locationName = location.name;
    let body = JSON.stringify(device);

    return getPutPromise(path, body, application);
}

// **************** DEVICE MODEL LOCATION CONFIG ****************

const getDeviceModelLocationConfigs = (application) => {
    return getGetPromise('/configs/', application);
}

const getDeviceConfigByLocation = (application, locationName) => {
    return getGetPromise(`/configs/${application.default_device_model}/${locationName}`, application);
}

// **************** LOCATIONS ****************

const getLocationsPromise = (application) => {
    return getGetPromise('/locations/', application);
}

const getLocationsByIdPromise = (gatewayUUID, application) => {
    
    return getGetPromise(`/locations/${removeInvalidChars(gatewayUUID)}`, application);
}

const getDevicesByLocationPromise = (gatewayUUID, application) => {
    return getGetPromise(`/locations/${removeInvalidChars(gatewayUUID)}/devices`, application);
}

const createLocationPromise = (gatewayUUID, description, application) => {
    let path = '/locations';
    let body = {
        'name': removeInvalidChars(gatewayUUID),
        'description': description,
        'parentName': application.rooms_location,
        'defaultLocation': false
    }
    return getPostPromise(path, body, application);
}

const updateLocationPromise = (gatewayUUID, description, application) => {
    let path = `/locations/${removeInvalidChars(gatewayUUID)}`;
    let body = {
        'name': removeInvalidChars(gatewayUUID),
        'description': description,
        'parentName': application.rooms_location,
        'defaultLocation': false
    }
    return getPutPromise(path, body, application);
}

const deleteLocationPromise = (gatewayUUID, application) => {
    let path = `/locations/${removeInvalidChars(gatewayUUID)}`;
    return getDeletePromise(path, application);
}

const createLocationConfigPromise = (gatewayUUID, data, application) => {
    let path = `/configs/${application.default_device_model}/${removeInvalidChars(gatewayUUID)}`;
    let body = JSON.stringify(data);
    return getPostPromise(path, body, application);
}

const deleteLocationConfigsPromise = (gatewayUUID, deviceModel, application) => {
    let path = `/configs/${deviceModel}/${removeInvalidChars(gatewayUUID)}`;
    return getDeletePromise(path, application);
}

// **************** APLICATION ****************


const createApplicationPromise = (gatewayUUID, client_id, client_secret) => {
    let path = `/applications?`;
    let body = {
        "name": removeInvalidChars(gatewayUUID),
        "friendlyName": "knotgateway",
        "description": "knot gateway"
      }
    
    application.client_id= client_id;
    application.client_secret=client_secret;
    application.app_name= removeInvalidChars(gatewayUUID);
    
    return getPostApplicationPromise(path, body, application);
}




// **************** EVENTS ****************

const getLastEventsPromise = (query, application) => {
    return getGetPromise(`/incomingEvents?${query}`, application);
}

// **************** EXPORTS ****************

module.exports = {
    createDevicePromise,
    getDevicesPromise,
    getDeviceCredentialsPromise,
    updateDeviceLocationPromise,

    getDeviceModelLocationConfigs,
    getDeviceConfigByLocation,
    
    getLocationsPromise,
    getLocationsByIdPromise,
    createLocationPromise,
    updateLocationPromise,
    deleteLocationPromise,
    createLocationConfigPromise,
    deleteLocationConfigsPromise,
    getDevicesByLocationPromise,

    createApplicationPromise,

    getLastEventsPromise,
};