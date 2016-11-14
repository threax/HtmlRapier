"use strict";

/**
 * Get an object from session storage.
 * @param name The name of the object to recover.
 * @param {T} defaultValue? - A default value if the object is not found. Will be undefined if nothing is passed in.
 * @returns
 */
export function getSessionObject<T>(name, defaultValue?:T):T {
    var str = sessionStorage.getItem(name);
    var recovered: T;
    if (str !== null) {
        str = JSON.parse(str);
    }
    else {
        recovered = defaultValue;
    }
    return recovered;
}

/**
 * Store an object in session storage.
 * @param name - The name of the object to store.
 * @param {T} value - The value to store.
 */
export function storeObjectInSession<T>(name, value:T) {
    sessionStorage.setItem(name, JSON.stringify(value));
}