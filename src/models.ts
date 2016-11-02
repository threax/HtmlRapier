"use strict";

import * as forms from 'hr.form';
import { TextStream } from 'hr.textstream';
import * as components from 'hr.components';
import * as typeId from 'hr.typeidentifiers';
import * as domQuery from 'hr.domquery';

function sharedClearer(i) {
    return "";
}

function FormModel(form, src) {
    this.setData = function (data) {
        forms.populate(form, data);
    }

    this.appendData = this.setData;

    function clear() {
        forms.populate(form, sharedClearer);
    }
    this.clear = clear;

    this.getData = function () {
        return forms.serialize(form);
    }

    this.getSrc = function () {
        return src;
    }
}

function ComponentModel(element, src, component) {
    this.setData = function (data, createdCallback, variantFinderCallback) {
        components.empty(element);
        this.appendData(data, createdCallback, variantFinderCallback);
    }

    this.appendData = function (data, createdCallback, variantFinderCallback) {
        if (typeId.isArray(data) || typeId.isForEachable(data)) {
            components.repeat(component, element, data, createdCallback, variantFinderCallback);
        }
        else if (data !== undefined && data !== null) {
            components.single(component, element, data, createdCallback, variantFinderCallback);
        }
    }

    function clear() {
        components.empty(element);
    }
    this.clear = clear;

    this.getData = function () {
        return {};
    }

    this.getSrc = function () {
        return src;
    }
}

function TextNodeModel(element, src) {
    var dataTextElements = undefined;

    this.setData = function (data) {
        dataTextElements = bindData(data, element, dataTextElements);
    }

    function clear() {
        dataTextElements = bindData(sharedClearer, element, dataTextElements);
    }
    this.clear = clear;

    this.appendData = this.setData;

    this.getData = function () {
        return {};
    }

    this.getSrc = function () {
        return src;
    }
}

function bindData(data, element, dataTextElements) {
    //No found elements, iterate everything.
    if (dataTextElements === undefined) {
        dataTextElements = [];
        domQuery.iterateNodes(element, NodeFilter.SHOW_TEXT, function (node) {
            var textStream = new TextStream(node.textContent);
            if (textStream.foundVariable()) {
                node.textContent = textStream.format(data);
                dataTextElements.push({
                    node: node,
                    stream: textStream
                });
            }
        });
    }
    //Already found the text elements, output those.
    else {
        for (var i = 0; i < dataTextElements.length; ++i) {
            var node = dataTextElements[i];
            node.node.textContent = node.stream.format(data);
        }
    }

    return dataTextElements;
}

export function build(element) {
    var src = element.getAttribute('data-hr-model-src');
    if (element.nodeName === 'FORM' || element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA') {
        return new FormModel(element, src);
    }
    else {
        var component = element.getAttribute('data-hr-model-component');
        if (component) {
            return new ComponentModel(element, src, component);
        }
        else {
            return new TextNodeModel(element, src);
        }
    }
}

export function NullModel() {
    this.setData = function (data) {

    }

    this.appendData = this.setData;

    this.clear = function () { }

    this.getData = function () {
        return {};
    }

    this.getSrc = function () {
        return "";
    }
}

/**
 * This interface describes a type that has a constructor that converts
 * a raw javascript object to a typed version of that object.
 */
export interface StrongTypeConstructor<T>{
    new(data:T|any);
}

/**
 * This class is a model that enforces its type.
 */
export class TypedModel<T>{
    private childModel;
    private strongConstructor;

    constructor(childModel: any, strongConstructor: StrongTypeConstructor<T>) {
        this.childModel = childModel;
        this.strongConstructor = strongConstructor;
    }

    setData(data: T) {
        this.childModel.setData(data);
    }

    appendData(data: T) {
        this.childModel.appendData(data);
    }

    clear() {
        this.childModel.clear();
    }

    getData(): T {
        return new this.strongConstructor(this.childModel.getData());
    }

    getSrc(): string {
        return this.childModel.getSrc();
    }
}