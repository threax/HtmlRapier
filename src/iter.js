"use strict";

/**
 * @callback htmlrest_iter_cb
 */

/**
 * @callback htmlrest_iter
 * @param {array} items - the items to iterate
 * @param {htmlrest_iter_cb} - the function to transform each object
 * @returns the transformed item and null when all items are iterated
 *
 * Iter defines a function that will return a function that iterates
 * over a collection. An iterator here is a single function with no argument
 * that returns null when its work is complete. This matches functions as data
 * used elsewhere. This makes an easy way to transform data before displaying it
 * by calling iter on the collection and then returning what you want from the callback.
 * 
 * You don't new this just call it e.g. iter(things, function(thing){ return thing + ' changes' });
 */
jsns.define("htmlrest.iter", function (using, exports) {},
function(exports, module){

    /**
     * Iterate over a collection of items calling cb for each one.
     * @param {array} items
     * @param {htmlrest_iter_cb} cb
     * @returns - The transformed item and null when all items are iterated.
     */
    function iter(items, cb) {
        var i = 0;
        return function () {
            if (i < items.length) {
                return cb(items[i++]);
            }
            return null;
        }
    }

    module.exports = iter;
});