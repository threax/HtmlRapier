"use strict";

import * as forms from 'hr.form';
import { TextStream } from 'hr.textstream';
import * as components from 'hr.components';
import * as typeId from 'hr.typeidentifiers';
import * as domQuery from 'hr.domquery';
import * as iter from 'hr.iterable';

function sharedClearer(i: number) {
    return "";
}

class FormModel<T> implements Model<T>{
    constructor(private form: string | HTMLElement, private src: string) {

    }
    
    public setData(data: T) {
        forms.populate(this.form, data);
    }
    
    public appendData(data: T) {
        forms.populate(this.form, data);
    }

    public clear() {
        forms.populate(this.form, sharedClearer);
    }

    public getData(): T {
        return <T>forms.serialize(this.form);
    }

    getSrc(): string {
        return this.src;
    }
}

 class ComponentModel<T> implements Model<T> {
    constructor(private element: HTMLElement, private src: string, private component: string){

    }

    public setData(data, createdCallback, variantFinderCallback) {
        components.empty(this.element);
        this.appendData(data, createdCallback, variantFinderCallback);
    }

    public appendData(data, createdCallback, variantFinderCallback) {
        if (typeId.isArray(data) || typeId.isForEachable(data)) {
            components.repeat(this.component, this.element, data, createdCallback, variantFinderCallback);
        }
        else if (data !== undefined && data !== null) {
            components.single(this.component, this.element, data, createdCallback, variantFinderCallback);
        }
    }

    public clear() {
        components.empty(this.element);
    }

    public getData(): T {
        return <T>{};
    }

    public getSrc(): string {
        return this.src;
    }
}

class TextNodeModel<T> implements Model<T> {
    private dataTextElements = undefined;

    constructor(private element: HTMLElement, private src: string){

    }

    public setData(data) {
        this.dataTextElements = TextNodeModel.bindData(data, this.element, this.dataTextElements);
    }

    public appendData(data) {
        this.dataTextElements = TextNodeModel.bindData(data, this.element, this.dataTextElements);
    }

    public clear() {
        this.dataTextElements = TextNodeModel.bindData(sharedClearer, this.element, this.dataTextElements);
    }

    public getData(): T {
        return <T>{};
    }

    public getSrc(): string {
        return this.src;
    }
    

    private static bindData(data, element, dataTextElements) {
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
}

export function build<T>(element) : Model<T> {
    var src = element.getAttribute('data-hr-model-src');
    if (element.nodeName === 'FORM' || element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA') {
        return new FormModel<T>(element, src);
    }
    else {
        var component = element.getAttribute('data-hr-model-component');
        if (component) {
            return new ComponentModel<T>(element, src, component);
        }
        else {
            return new TextNodeModel<T>(element, src);
        }
    }
}

export class NullModel implements Model<any> {
    constructor(){

    }

    public setData(data): void {

    }

    public appendData(data): void {

    }

    public clear(): void {

    }

    public getData() {
        return {};
    }

    public getSrc() {
        return "";
    }
}

/**
 * The basic interface for model instances.
 */
export interface Model<T>{
    /**
     * Set the data on the model. The model will not modify the data passed in again,
     * you must call getData to get it back out.
     */
    setData(data: T | T[] | iter.IterableInterface<T>, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>);

    /**
     * Add more data to the model, does not erase existing data.
     */
    appendData(data: T, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>);

    /**
     * Clear all data from the model.
     */
    clear();

    /**
     * Get the current data from the model.
     */
    getData(): T;

    /**
     * Get the data source for the model.
     */
    getSrc(): string;
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
export class StrongTypedModel<T> implements Model<T>{
    protected childModel;
    protected strongConstructor;

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