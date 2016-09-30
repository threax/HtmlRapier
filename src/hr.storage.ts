"use strict";

//The instance storage, 
var instanceStorage = {};

/**
* @description Get the sesssion data, can specify a default value.
* @param {string} name The name of the data to recover
* @param {object} defaultValue, if not supplied is null
* @return {object} The recovered object
*/
export function getSessionJson(name, defaultValue) {
    if (defaultValue === undefined) {
        defaultValue = null;
    }

    var recovered = sessionStorage.getItem(name);
    if (recovered !== null) {
        recovered = JSON.parse(recovered);
    }
    else {
        recovered = defaultValue;
    }
    return recovered;
}

/**
* @description Get the sesssion data, can specify a default value.
* @param {string} name The name of the data to store
* @param {object} value, if not supplied is null
*/
export function storeJsonInSession(name, value) {
    sessionStorage.setItem(name, JSON.stringify(value));
}