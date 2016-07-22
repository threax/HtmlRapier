"use strict";

/**
 * Iter defines a function that will return a function that iterates
 * over a collection. An iterator here is a single function with no argument
 * that returns null when its work is complete. This matches functions as data
 * used elsewhere. This makes an easy way to transform data before displaying it
 * by calling iter on the collection and then returning what you want from the callback.
 */
jsns.define("htmlrest.iter", function (using) {
    return function (items, cb) {
        var i = 0;
        return function () {
            if (i < items.length) {
                return cb(items[i++]);
            }
            return null;
        }
    }
});