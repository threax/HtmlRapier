"use strict";

jsns.define("htmlrest.domquery", function (using) {
    using("htmlrest.typeidentifiers");
},
function(exports, module, typeId){

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

    /**
     * Derive the plain javascript element from a passed element
     * @param {string|HTMLElement} element - the element to detect
     * @returns {HTMLElement} - The located html element.
     */
    function first(element, context) {
        if (typeId.isString(element)) {
            if (context !== undefined) {
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
    };
    exports.first = first;

    /**
     * Query all passed javascript elements
     * @param {string|HTMLElement} element - the element to detect
     * @param {HTMLElement} element - the context to search
     * @returns {array[HTMLElement]} - The results array to append to.
     * @returns {array[HTMLElement]} - The located html element. Will be the results array if one is passed otherwise a new one.
     */
    function all(element, context, results) {
        if (typeId.isString(element)) {
            if (results === undefined) {
                results = [];
            }

            if (context !== undefined) {
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
            if (results === undefined) {
                results = [element];
            }
            else {
                results.push(element);
            }
        }
        else {
            if (results === undefined) {
                results = element;
            }
            else {
                for (var i = 0; i < element.length; ++i) {
                    results.push(element[i]);
                }
            }
        }
        return results;
    };
    exports.all = all;

    /**
     * Determine if an element matches the given selector.
     * @param {type} element
     * @param {type} selector
     * @returns {type} 
     */
    function matches(element, selector) {
        return element.matches(selector);
    }
    exports.matches = matches;

    function nodesToArray(nodes, arr) {
        for (var i = 0; i < nodes.length; ++i) {
            arr.push(nodes[i]);
        }
    }
});