"use strict";

jsns.define("hr.doccookies", null,
function (exports, module) {
    //These three functions are from
    //http://www.quirksmode.org/js/cookies.html
    //The names were shortened

    /**
     * Create a cookie on the doucment.
     * @param {type} name - The name of the cookie
     * @param {type} value - The value of the cookie
     * @param {type} days - The expiration in days for the cookie
     */
    function create(name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toUTCString();
        }
        else var expires = "";
        document.cookie = name + "=" + value + expires + "; path=/";
    }
    exports.create = create;

    /**
     * Read a cookie from the document.
     * @param {type} name - The name of the cookie to read
     * @returns {type} - The cookie value.
     */
    function read(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    exports.read = read;

    /**
     * Erase a cookie from the document.
     * @param {type} name
     */
    function erase(name) {
        create(name, "", -1);
    }
    exports.erase = erase;
});