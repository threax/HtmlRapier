"use strict";

jsns.define("htmlrest.domquery", function (using) {
    var typeId = using("htmlrest.typeidentifiers");

    //Polyfill for matches
    //https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
    if (!Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            function (s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) { }
                return i > -1;
            };
    }

    return {
        /**
         * Derive the plain javascript element from a passed element
         * @param {string|HTMLElement} element - the element to detect
         * @returns {HTMLElement} - The located html element.
         */
        first: function (element, context) {
            if (typeId.isString(element)) {
                if (context !== undefined){
                    if (this.matches(context, element)) {
                        element = context;
                    }
                    else {
                        element = context.querySelector(element);
                    }
                }
                else {
                    element = document.querySelector(element);
                }
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
                if (context !== undefined){
                    if (this.matches(context, element)) {
                        results.push(context);
                    }
                    else {
                        nodesToArray(context.querySelectorAll(element), results);
                    }
                }
                else {
                    nodesToArray(document.querySelectorAll(element), results);
                }
            }
            else if (!typeId.isArray(element)) {
                results.push(element);
            }
            else {
                for (var i = 0; i < element.length; ++i) {
                    results.push(element[i]);
                }
            }
            return results;
        },

        /**
         * Determine if an element matches the given selector.
         * @param {type} element
         * @param {type} selector
         * @returns {type} 
         */
        matches: function (element, selector) {
            return element.matches(selector);
        }
    };

    function nodesToArray(nodes, arr) {
        for (var i = 0; i < nodes.length; ++i) {
            arr.push(nodes[i]);
        }
    }
});