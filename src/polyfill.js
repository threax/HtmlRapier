var htmlrest = htmlrest || {};

//Polyfill for CustomEvent
//https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
(function () {

    if (typeof window.CustomEvent === "function") return false;

    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();

//isArray polyfill
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
 * @param {object} test - The object to test
 * @returns {boolean} - True if a string, false if not
 */
htmlrest.isString = function (test) {
    return typeof (test) === 'string';
}

/**
 * Determine if a variable is a function.
 * @param {object} test - The object to test
 * @returns {boolean} - True if a function, false if not
 */
htmlrest.isFunction = function (test) {
    return typeof (test) === 'function';
}