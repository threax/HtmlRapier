"use strict";

jsns.define("htmlrest.domquery", function (using) {
    var typeId = using("htmlrest.typeidentifiers");

    return {
        /**
         * Derive the plain javascript element from a passed element
         * @param {string|HTMLElement} element - the element to detect
         * @returns {HTMLElement} - The located html element.
         */
        first: function (element, context) {
            if (typeId.isString(element)) {
                if (context !== undefined && this.matches(context, element)) {
                    element = context;
                }
                else {
                    element = Sizzle(element, context)[0];
                }
            }
            if (element instanceof jQuery) {
                element = element[0]; //This should be the only jQuery
            }
            return element;
        },

        /**
         * Query all passed javascript elements
         * @param {string|HTMLElement} element - the element to detect
         * @param {HTMLElement} element - the context to search
         * @returns {array[HTMLElement]} - The results array to append to.
         * @returns {array[HTMLElement]} - The located html element. Will be the results array if one is passed otherwise a new one.
         */
        all: function (element, context, results) {
            if (results === undefined) {
                results = [];
            }
            if (typeId.isString(element)) {
                if (context !== undefined && this.matches(context, element)) {
                    results.push()
                }

                element = Sizzle(element, context, results);
            }
            if (element instanceof jQuery) {
                results = element; //This should be the only jQuery
            }
            else if (!typeId.isArray(element)) {
                results = [element];
            }
            else {
                results = element;
            }
            return results;
        },

        /**
         * Determine if an element matches the given selector.
         * @param {type} element
         * @param {type} selector
         * @returns {type} 
         */
        matches: function(element, selector) {
            return Sizzle.matchesSelector(element, selector);
        }
    };
});