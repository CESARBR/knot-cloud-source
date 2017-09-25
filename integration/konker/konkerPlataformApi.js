'use restrict';

require('./common/winstonConfig')

const axios   = require('axios');
const config  = require('../../config.js');
var dotenv = require('dotenv');
dotenv.load();

const plataformTokenMap = new Map();

// **************** INIT ****************
const getToken = () => {
    return plataformTokenMap.get(process.env.KONKER_USER);
}

const requestToken = () => {

    // check in cache first
    if (process.env.KONKER_USER === null || process.env.KONKER_PASS === null ) {
        return Promise.reject('user or password invalid');
    } else if (plataformTokenMap.get(process.env.KONKER_USER)) {
        return Promise.resolve(plataformTokenMap.get(process.env.KONKER_USER));
    } else {
        LOGGER.debug(`[${process.env.KONKER_USER}] Getting access token`);

        let authHost  = `${config.konkerAPI.host}/v1/oauth/token`;
        let authUrl   = `?grant_type=client_credentials&client_id=${process.env.KONKER_USER}&client_secret=${process.env.KONKER_PASS}`;

        return axios
            .get(authHost + authUrl)
            .then(res => {
                try {
                    let token = res.data.access_token;
                    plataformTokenMap.set(process.env.KONKER_USER, token);
                    return token;
                } catch(e) {
                    throw e;
                }
            });
    }

}

// **************** SUPPORT FUNCTIONS ****************
const getGetPromise = (path, application) => {

    LOGGER.debug(`[${process.env.KONKER_USER}] GET ${path}`);

    return requestToken()
        .then(() => {
            return axios.get(`${config.konkerAPI.host}/v1/${application}${path}`,
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            })
            .then(
                res =>  res.data.result
            );
        });

}

const getPutPromise = (path, body, application) => {

    LOGGER.debug(`[${process.env.KONKER_USER}] PUT ${path}`);

    return requestToken()
        .then(() => {
            return axios.put(`${config.konkerAPI.host}/v1/${application}${path}`,
            body,
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });
        });

}

const getPostPromise = (path, body, application) => {

    LOGGER.debug(`[${process.env.KONKER_USER}] POST ${path}`);

    let completePath
    if (application) {
        completePath = `${application}${path}`
    } else {
        completePath = `${path}`
    }

    return requestToken()
        .then(() => {
            return axios.post(`${config.konkerAPI.host}/v1/${completePath}`,
            body,
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });
        });

}

const getDeletePromise = (path, application) => {
    
    LOGGER.debug(`[${process.env.KONKER_USER}] DELETE ${path}`);
    
    return requestToken()
        .then(() => {
            return axios.delete(`${config.konkerAPI.host}/v1/${application}${path}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });
        });
}

// **************** DEVICES ****************
const removeInvalidChars = (UUID) => {
    return UUID.replace(/\-/g,'')
}
    
const createDevicePromise = (application, deviceId) => {
    let path = `/devices`;
    let clearedDeviceId=removeInvalidChars(deviceId);
    let body = {
        "id": clearedDeviceId.substring(clearedDeviceId.length - 16),
        "name": "knotthing",
        "description": "knot thing",
        "active": true
    }
    return getPostPromise(path, body, removeInvalidChars(application));
}

const getDeviceCredentialsPromise = (application, deviceGuid) => {
    return getGetPromise(`/deviceCredentials/${deviceGuid}`, removeInvalidChars(application));
}

// **************** APLICATION ****************
const createApplicationPromise = (gatewayUUID) => {
    let path = '/applications';
    let body = {
        "name": removeInvalidChars(gatewayUUID),
        "friendlyName": "knotgateway",
        "description": "knot gateway"
      }
    
    
    return getPostPromise(path, body);
}

// **************** EXPORTS ****************
module.exports = {
    createDevicePromise,
    getDeviceCredentialsPromise,
    createApplicationPromise
};