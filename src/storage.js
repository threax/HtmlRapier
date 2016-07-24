"use strict";

jsns.define("htmlrest.storage", null,
function(exports, module){
    //The instance storage, 
    var instanceStorage = {};

    /**
    * @description Get the sesssion data, can specify a default value.
    * @param {string} name The name of the data to recover
    * @param {object} defaultValue, if not supplied is null
    * @return {object} The recovered object
    */
    function getSessionJson(name, defaultValue) {
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
    exports.getSessionJson = getSessionJson;

    /**
    * @description Get the sesssion data, can specify a default value.
    * @param {string} name The name of the data to store
    * @param {object} value, if not supplied is null
    */
    function storeJsonInSession(name, value) {
        sessionStorage.setItem(name, JSON.stringify(value));
    }
    exports.storeJsonInSession = storeJsonInSession;

    /**
    * @description Get the instance data, can specify a default value.
    * If the value is not found and is given, the default value will be 
    * added to the instance storage.
    *
    * Instance storage is destroyed each page load
    * @param {string} name The name of the data to store
    * @param {object} value, if not supplied is null
    */
    function getInInstance(name, value) {
        if (instanceStorage.hasOwnProperty(name)) {
            return instanceStorage[name];
        }
        else {
            if (value !== undefined) {
                this.storeInInstance(name, value);
            }
            return value;
        }
    }
    exports.getInInstance = getInInstance;

    /**
    * @description Get the instance data, can specify a default value.
    * @param {string} name The name of the data to store
    * @param {object} value, if not supplied is null
    */
    function storeInInstance(name, value) {
        instanceStorage[name] = value;
    }
    exports.storeInInstance = storeInInstance;
});