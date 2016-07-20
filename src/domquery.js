"use strict";

jsns.define("htmlrest.domquery", function (using) {
    var typeId = using("htmlrest.typeidentifiers");

    /**
     * Derive the plain javascript element from a passed element
     * @param {string|HTMLElement} element - the element to detect
     * @returns {HTMLElement} - The located html element.
     */
    return {
        first: function (element) {
            if (typeId.isString(element)) {
                element = Sizzle(element)[0]; //This should be the only Sizzle
            }
            if (element instanceof jQuery) {
                element = element[0]; //This should be the only jQuery
            }
            return element;
        },
        all: function (element) {
            if (typeId.isString(element)) {
                element = Sizzle(element); //This should be the only Sizzle
            }
            if (element instanceof jQuery) {
                element = element; //This should be the only jQuery
            }
            else if (!typeId.isArray(element)) {
                element = [element];
            }
            return element;
        }
    };
});