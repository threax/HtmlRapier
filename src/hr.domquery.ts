"use strict";

import * as typeId from './hr.typeidentifiers';

/**
 * Derive the plain javascript element from a passed element
 * @param {string|HTMLElement} element - the element to detect
 * @returns {HTMLElement} - The located html element.
 */
export function first(element: HTMLElement | string, context?: HTMLElement): HTMLElement {
    if (typeof element === 'string') {
        if (context !== undefined) {
            if (this.matches(context, element)) {
                return context;
            }
            else{
                return context.querySelector(element) as HTMLElement;
            }
        }
        else {
            return document.querySelector(element) as HTMLElement;
        }
    }
    if (element instanceof Node) {
        return element;
    }
};

/**
 * Query all passed javascript elements
 * @param {string|HTMLElement} element - the element to detect
 * @param {HTMLElement} element - the context to search
 * @returns {array[HTMLElement]} - The results array to append to.
 * @returns {array[HTMLElement]} - The located html element. Will be the results array if one is passed otherwise a new one.
 */
export function all(element: HTMLElement | HTMLElement[] | string, context?: HTMLElement, results?: HTMLElement[]): HTMLElement[] {
    if (typeof element === 'string') {
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
    else if (element instanceof HTMLElement) {
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

/**
 * Query all passed javascript elements
 * @param {string|HTMLElement} element - the element to detect
 * @param {HTMLElement} element - the context to search
 * @param cb - Called with each htmlelement that is found
 */
export function iterate(element, context, cb) {
    if (typeId.isString(element)) {
        if (context) {
            if (this.matches(context, element)) {
                cb(context);
            }
            else {
                iterateQuery(context.querySelectorAll(element), cb);
            }
        }
        else {
            iterateQuery(document.querySelectorAll(element), cb);
        }
    }
    else if (!typeId.isArray(element)) {
        cb(element);
    }
    else {
        for (var i = 0; i < element.length; ++i) {
            cb(element[i]);
        }
    }
};

function alwaysTrue(node) {
    return true;
}

class AlwaysTrueNodeFilter implements NodeFilter {
    acceptNode(n: Node) {
        return NodeFilter.FILTER_ACCEPT;
    }
}

/**
 * Iterate a node collection using createNodeIterator. There is no query for this version
 * as it iterates everything and allows you to extract what is needed.
 * @param  element - The root element
 * @param  cb - The function called for each item iterated
 * @param {NodeFilter} whatToShow - see createNodeIterator, defaults to SHOW_ALL
 */
export function iterateNodes(element, whatToShow, cb) {
    var iter = document.createNodeIterator(element, whatToShow, new AlwaysTrueNodeFilter(), false);
    var node;
    while (node = iter.nextNode()) {
        cb(node);
    }
}

/**
 * Determine if an element matches the given selector.
 * @param {type} element
 * @param {type} selector
 * @returns {type} 
 */
export function matches(element, selector) {
    return element.matches(selector);
}

function nodesToArray(nodes, arr) {
    for (var i = 0; i < nodes.length; ++i) {
        arr.push(nodes[i]);
    }
}

function iterateQuery(nodes, cb) {
    for (var i = 0; i < nodes.length; ++i) {
        cb(nodes[i]);
    }
}