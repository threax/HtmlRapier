﻿"use strict";

import * as typeId from './typeidentifiers';
import * as domquery from './domquery';
import { BindingCollection } from './bindingcollection';
import * as textstream from './textstream';

export interface IComponentBuilder {
    create(data: textstream.ITextStreamData, parentComponent: Node, insertBeforeSibling: Node, variant: string): BindingCollection;
}

interface ComponentFactory {
    [s: string]: IComponentBuilder;
}

var factory: ComponentFactory = {};

/**
 * Register a function with the component system.
 * @param name - The name of the component
 * @param createFunc - The function that creates the new component.
 */
export function register(name: string, builder: IComponentBuilder): void {
    factory[name] = builder;
}

export function isDefined(name: string): boolean {
    return factory[name] !== undefined;
}

export function getComponent(name: string): IComponentBuilder {
    return factory[name];
}

export interface VariantFinderCallback<T> {
    (item: T): string
}

export interface CreatedCallback<T> {
    (created: any, item: T): void
}

/**
 * Get the default vaule if variant is undefined.
 * @returns variant default value (null)
 */
function getDefaultVariant(item: any) {
    return null;
}

/**
 * Create a single component.
 */
export function one(name: string, data: textstream.ITextStreamData, parentComponent: Node | string, insertBeforeSibling: Node, createdCallback?: CreatedCallback<textstream.ITextStreamData>, variantFinder?: VariantFinderCallback<textstream.ITextStreamData>) {
    var variant: string;
    if (variantFinder === undefined) {
        variantFinder = getDefaultVariant(data);
    }
    else if (typeId.isFunction(variantFinder)) {
        variant = variantFinder(data);
    }
    return doCreateComponent(name, data, parentComponent, insertBeforeSibling, variant, createdCallback);
}

/**
 * Create a component for each element in data using that element as the data for the component.
 * @param {string} name - The name of the component to create.
 * @param {HTMLElement} parentComponent - The html element to attach the component to.
 * @param {array|object} data - The data to repeat and bind, must be an array or object with a forEach method to be iterated.
 * If it is a function return the data and then return null to stop iteration.
 * @param {exports.createComponent~callback} createdCallback
 */
export function many(name: string, data: textstream.ITextStreamData[] | typeId.ForEachable<textstream.ITextStreamData>, parentComponent: HTMLElement, insertBeforeSibling: Node, createdCallback: CreatedCallback<textstream.ITextStreamData>, variantFinder?: VariantFinderCallback<textstream.ITextStreamData>) {
    if (variantFinder === undefined) {
        variantFinder = getDefaultVariant;
    }
    //Look for an insertion point
    var insertBefore = parentComponent.firstElementChild;
    var variant;
    while (insertBefore != null && !insertBefore.hasAttribute('data-hr-insert')) {
        insertBefore = insertBefore.nextElementSibling;
    }

    var fragmentParent = document.createDocumentFragment();

    //Output
    if (typeId.isArray(data)) {
        //An array, read it as fast as possible
        var arrData = <textstream.ITextStreamData[]>data;
        for (var i = 0; i < arrData.length; ++i) {
            variant = variantFinder(arrData[i]);
            doCreateComponent(name, arrData[i], fragmentParent, null, variant, createdCallback);
        }
    }
    else if (typeId.isForEachable<textstream.ITextStreamData>(data)) {
        //Data supports a 'foreach' method, use this to iterate it
        (<any>data).forEach(function (item: textstream.ITextStreamData) {
            variant = variantFinder(item);
            doCreateComponent(name, item, fragmentParent, null, variant, createdCallback);
        });
    }

    parentComponent.insertBefore(fragmentParent, insertBefore);
}

/**
 * Remove all children from an html element
 */
export function empty(parentComponent: Node | string) {

    var parent: Node = domquery.first(parentComponent);
    var currentNode = parent.lastChild;
    var nextNode = null;

    //Walk the nodes and remove any non keepers
    while (currentNode != null) {
        nextNode = currentNode.previousSibling;
        if (currentNode.nodeType !== 1 || !(currentNode instanceof HTMLElement && currentNode.hasAttribute('data-hr-keep'))) {
            parent.removeChild(currentNode);
        }
        currentNode = nextNode;
    }
}

function doCreateComponent(name: string, data: textstream.ITextStreamData, parentComponent: Node | string, insertBeforeSibling: Node, variant: string, createdCallback: CreatedCallback<textstream.ITextStreamData>) {
    parentComponent = domquery.first(parentComponent);
    if (factory.hasOwnProperty(name)) {
        const created = factory[name].create(data, parentComponent, insertBeforeSibling, variant);
        if (createdCallback !== undefined && createdCallback !== null) {
            createdCallback(created, data);
        }
        return created;
    }
    else {
        console.log("Failed to create component '" + name + "', cannot find factory, did you forget to define it on the page?")
    }
}