var htmlrest = htmlrest || {};

/**
 * Array.isArray polyfill
 */
(function () {
    //only implement if no native implementation is available
    if (typeof Array.isArray === 'undefined') {
        Array.isArray = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        }
    };
})();

/**
 * Determine if a variable is a string.
 * @param test - The object to test
 * @returns {boolean} - True if a string, false if not
 */
htmlrest.isString = function (test) {
    return typeof (test) === 'string';
}

/**
 * Determine if a variable is a function.
 * @param test - The object to test
 * @returns {boolean} - True if a function, false if not
 */
htmlrest.isFunction = function (test) {
    return typeof (test) === 'function';
}

/**
 * Determine if a variable is an object.
 * @param test - The object to test
 * @returns {boolean} - True if an object, false if not
 */
htmlrest.isObject = function (test) {
    return typeof data === 'object';
}