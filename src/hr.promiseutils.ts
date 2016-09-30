//This module defines html nodes that are ignored and a way to check to see if a node is ignored or the
//child of an ignored node. Ignored nodes are defined with the data-hr-ignored attribute.
jsns.define("hr.promiseutils", [
],
function (exports, module, domQuery) {
    "use strict";

    /**
     * This is a wrapper for a promise that exposes the resolve
     * and reject functions. You do not have to supply a callback function
     * since you will have access to the resolve and reject functions.
     * @param {type} promiseFunc
     * @returns {type} 
     */
    function External(promiseFunc) {
        var external:any = {};

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

    exports.External = External;
});