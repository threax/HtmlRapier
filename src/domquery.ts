"use strict";

import * as typeId from './typeidentifiers';

export type NodeIteratorCallback = (node: Node) => void;
export type ElementIteratorCallback = (element: Element) => void;

/**
 * Derive the plain javascript element from a passed element
 * @param {string|Node} element - the element to detect
 * @returns {Node} - The located html element.
 */
export function first(element: Node | string, context?: HTMLElement): Node {
    if (typeof element === 'string') {
        if (context !== undefined) {
            if (matches(context, element)) {
                return context;
            }
            else {
                return context.querySelector(element);
            }
        }
        else {
            return document.querySelector(element);
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
            //Be sure to include the main element if it matches the selector.
            if (matches(context, element)) {
                results.push(context);
            }
            
            //This will add all child elements that match the selector.
            nodesToArray(context.querySelectorAll(element), results);
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
export function iterate(element: HTMLElement | HTMLElement[] | string, context: HTMLElement, cb: ElementIteratorCallback) {
    if (typeId.isString(element)) {
        if (context) {
            if (matches(context, element)) {
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
    else if (element instanceof HTMLElement) {
        cb(element);
    }
    else if (Array.isArray(element)) {
        for (var i = 0; i < element.length; ++i) {
            cb(element[i]);
        }
    }
};

function alwaysTrue(node) {
    return true;
}

//createNodeIterator is tricky, this will make sure it can be called on ie and modern browsers
var createNodeIteratorShim = function (root: Node, whatToShow?: number) {
    return document.createNodeIterator(root, whatToShow);
}
try {
    //See if the default version works, no error should occur during the following call.
    const iter = createNodeIteratorShim(document, NodeFilter.SHOW_ELEMENT);
} catch (_) {
    //If we get an error here the default version does not work, so use the shimmed version for ie.
    createNodeIteratorShim = function (root: Node, whatToShow?: number) {
        return (<any>document).createNodeIterator(root, whatToShow, alwaysTrue, false);
    }
}

/**
 * Iterate a node collection using createNodeIterator. There is no query for this version
 * as it iterates everything and allows you to extract what is needed.
 * @param  element - The root element
 * @param {NodeFilter} whatToShow - see createNodeIterator, defaults to SHOW_ALL
 * @param  cb - The function called for each item iterated
 */
export function iterateNodes(node: Node, whatToShow?: number, cb?: NodeIteratorCallback) {
    var iter = createNodeIteratorShim(node, whatToShow);
    var resultNode;
    while (resultNode = iter.nextNode()) {
        cb(resultNode);
    }
}

/**
 * Iterate an element collection using createNodeIterator with SHOW_ELEMENT as its arg. 
 * There is no query for this version as it iterates everything and allows you to extract what is needed.
 * @param  element - The root element
 * @param {NodeFilter} whatToShow - see createNodeIterator, defaults to SHOW_ALL
 * @param  cb - The function called for each item iterated
 */
export function iterateElementNodes(node: Node, cb?: ElementIteratorCallback) {
    var iter = createNodeIteratorShim(node, NodeFilter.SHOW_ELEMENT);
    var resultNode: any;
    while (resultNode = iter.nextNode()) {
        cb(resultNode);
    }
}

/**
 * Determine if an element matches the given selector.
 * @param {type} element
 * @param {type} selector
 * @returns {type} 
 */
export function matches(element: Element, selector: string) {
    return element.matches(selector);
}

function nodesToArray(nodes: NodeListOf<Element>, arr: Element[]) {
    for (var i = 0; i < nodes.length; ++i) {
        arr.push(nodes[i]);
    }
}

function iterateQuery(nodes: NodeListOf<Element>, cb: ElementIteratorCallback) {
    for (var i = 0; i < nodes.length; ++i) {
        cb(nodes[i]);
    }
}