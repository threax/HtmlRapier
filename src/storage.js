"use strict";

jsns.define("htmlrest.storage", function (using) {
    //The instance storage, 
    var instanceStorage = {};

    return {
        /**
        * @description Get the sesssion data, can specify a default value.
        * @param {string} name The name of the data to recover
        * @param {object} defaultValue, if not supplied is null
        * @return {object} The recovered object
        */
        getSessionJson: function (name, defaultValue) {
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
        },
        /**
        * @description Get the sesssion data, can specify a default value.
        * @param {string} name The name of the data to store
        * @param {object} value, if not supplied is null
        */
        storeJsonInSession: function (name, value) {
            sessionStorage.setItem(name, JSON.stringify(value));
        },
        /**
        * @description Get the instance data, can specify a default value.
        * If the value is not found and is given, the default value will be 
        * added to the instance storage.
        *
        * Instance storage is destroyed each page load
        * @param {string} name The name of the data to store
        * @param {object} value, if not supplied is null
        */
        getInInstance: function (name, value) {
            if (instanceStorage.hasOwnProperty(name)) {
                return instanceStorage[name];
            }
            else {
                if (value !== undefined) {
                    this.storeInInstance(name, value);
                }
                return value;
            }
        },
        /**
        * @description Get the instance data, can specify a default value.
        * @param {string} name The name of the data to store
        * @param {object} value, if not supplied is null
        */
        storeInInstance: function (name, value) {
            instanceStorage[name] = value;
        }
    };
});