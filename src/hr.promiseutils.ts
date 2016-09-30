"use strict";

/**
 * This is a wrapper for a promise that exposes the resolve
 * and reject functions. You do not have to supply a callback function
 * since you will have access to the resolve and reject functions.
 * @param {type} promiseFunc
 * @returns {type} 
 */
export function External(promiseFunc) {
    var external: any = {};

    var promise = new Promise(function (resolve, reject) {
        external.resolve = resolve;
        external.reject = reject;
        if (promiseFunc !== undefined) {
            return promiseFunc(resolve, reject);
        }
    });

    external.promise = promise;

    return external;
};