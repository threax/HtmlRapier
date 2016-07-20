"use strict";

jsns.define("htmlrest.typeidentifiers", function (using) {
    //only implement if no native implementation is available
    if (typeof Array.isArray === 'undefined') {
        Array.isArray = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        }
    };

    var exports = {};

    /**
     * Determine if a variable is an array.
     * @param test - The object to test
     * @returns {boolean} - True if the object is an array
     */
    exports.isArray = function(test){
        return Array.isArray(test);
    }

    /**
     * Determine if a variable is a string.
     * @param test - The object to test
     * @returns {boolean} - True if a string, false if not
     */
    exports.isString = function (test) {
        return typeof (test) === 'string';
    }

    /**
     * Determine if a variable is a function.
     * @param test - The object to test
     * @returns {boolean} - True if a function, false if not
     */
    exports.isFunction = function (test) {
        return typeof (test) === 'function';
    }

    /**
     * Determine if a variable is an object.
     * @param test - The object to test
     * @returns {boolean} - True if an object, false if not
     */
    exports.isObject = function (test) {
        return typeof data === 'object';
    }

    return exports;
});

