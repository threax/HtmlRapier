"use strict";

import * as typeId from 'hr.typeidentifiers';
import * as domquery from 'hr.domquery';

var factory = {};

/**
 * This callback is called when a component is created
 * @callback exports.createComponent~callback
 * @param {exports.component.BindingCollection} created
 * @param {object} data
 */

/**
 * This callback is called when a component is about to be created and we want its variant.
 * @callback exports.createComponent~callback
 * @param {object} data - The data to identify a variant for.
 * @return {string} the name of the variant to use or null to use the original.
 */

/**
 * This callback is used to create components when they are requested.
 * @callback exports.registerComponent~callback
 * @param {exports.component.BindingCollection} created
 * @param {object} data
 * @returns {exports.component.BindingCollection} 
 */

/**
 * Register a function with the component system.
 * @param {string} name - The name of the component
 * @param {exports.registerComponent~callback} createFunc - The function that creates the new component.
 */
export function register(name, createFunc) {
    factory[name] = createFunc;
}

export interface VariantFinderCallback<T> {
    (item: T) : string
}

export interface CreatedCallback<T> {
    (created: any, item: T): void
}

/**
 * Get the default vaule if variant is undefined.
 * @returns variant default value (null)
 */
function getDefaultVariant(item:any) {
    return null;
}

/**
 * Create a single component.
 * @param name
 * @param parentComponent
 * @param {T} data
 * @param {CreatedCallback<T>} createdCallback?
 * @param {VariantFinderCallback<T>} variantFinder?
 * @returns
 */
export function single<T>(name: string, parentComponent, data: T, createdCallback?: CreatedCallback<T>, variantFinder?: VariantFinderCallback<T>) {
    var variant: string;
    if (variantFinder === undefined) {
        variantFinder = getDefaultVariant(data);
    }
    else if (typeId.isFunction(variantFinder)) {
        variant = variantFinder(data);
    }
    return doCreateComponent(name, data, parentComponent, null, variant, createdCallback);
}

/**
 * Create a component for each element in data using that element as the data for the component.
 * @param {string} name - The name of the component to create.
 * @param {HTMLElement} parentComponent - The html element to attach the component to.
 * @param {array|object} data - The data to repeat and bind, must be an array or object with a forEach method to be iterated.
 * If it is a function return the data and then return null to stop iteration.
 * @param {exports.createComponent~callback} createdCallback
 */
export function repeat<T>(name, parentComponent, data: T, createdCallback: CreatedCallback<T>, variantFinder?: VariantFinderCallback<T>) {
    if (variantFinder === undefined) {
        variantFinder = getDefaultVariant;
    }
    //Look for an insertion point
    var insertBefore = null;
    var insertBefore = parentComponent.firstElementChild;
    var variant;
    while (insertBefore != null && !insertBefore.hasAttribute('data-hr-insert')) {
        insertBefore = insertBefore.nextElementSibling;
    }

    var fragmentParent = document.createDocumentFragment() as HTMLElement;

    //Output
    if (typeId.isArray(data)) {
        //An array, read it as fast as possible
        var arrData = <any>data;
        for (var i = 0; i < arrData.length; ++i) {
            variant = variantFinder(arrData[i]);
            doCreateComponent(name, arrData[i], fragmentParent, null, variant, createdCallback);
        }
    }
    else if (typeId.isForEachable(data)) {
        //Data supports a 'foreach' method, use this to iterate it
        (<any>data).forEach(function (item) {
            variant = variantFinder(item);
            doCreateComponent(name, item, fragmentParent, null, variant, createdCallback);
        })
    }

    parentComponent.insertBefore(fragmentParent, insertBefore);
}

/**
 * Remove all children from an html element
 */
export function empty(parentComponent: HTMLElement | string) {

    var parent: Node = domquery.first(parentComponent);
    var currentNode = parent.firstChild;
    var nextNode = null;

    //Walk the nodes and remove any non keepers
    while (currentNode != null) {
        nextNode = currentNode.nextSibling;
        if (currentNode.nodeType !== 1 || !(currentNode instanceof HTMLElement && currentNode.hasAttribute('data-hr-keep'))) {
            parent.removeChild(currentNode);
        }
        currentNode = nextNode;
    }
}

function doCreateComponent<T>(name, data: T, parentComponent: HTMLElement | string, insertBeforeSibling, variant: string, createdCallback: CreatedCallback<T>) {
    parentComponent = domquery.first(parentComponent);
    if (factory.hasOwnProperty(name)) {
        var created = factory[name](data, parentComponent, insertBeforeSibling, variant);
        if (createdCallback !== undefined && createdCallback !== null) {
            createdCallback(created, data);
        }
        return created;
    }
    else {
        console.log("Failed to create component '" + name + "', cannot find factory, did you forget to define it on the page?")
    }
}