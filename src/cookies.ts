"use strict";

//These three functions are from
//http://www.quirksmode.org/js/cookies.html
//The names were shortened

/**
 * Create a cookie on the doucment.
 * @param {type} name - The name of the cookie
 * @param {type} value - The value of the cookie
 * @param {type} days - The expiration in days for the cookie
 */
export function create(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toUTCString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

/**
 * Read a cookie from the document.
 * @param {type} name - The name of the cookie to read
 * @returns {type} - The cookie value.
 */
export function read(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * Erase a cookie from the document.
 * @param {type} name
 */
export function erase(name) {
    create(name, "", -1);
}