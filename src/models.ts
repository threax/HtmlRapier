"use strict";

import * as forms from 'hr.form';
import * as views from 'hr.view';
import { TextStream } from 'hr.textstream';
import * as components from 'hr.components';
import * as typeId from 'hr.typeidentifiers';
import * as domQuery from 'hr.domquery';
import * as iter from 'hr.iterable';

export function build<T>(element) : Model<T> {
    var src = element.getAttribute('data-hr-model-src');
    if (element.nodeName === 'FORM' || element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA') {
        var shim = forms.build<T>(element);
        (<any>shim).appendData = (data: T) =>{
            shim.setData(data);
        };
        return <Model<T>>shim;
    }
    else {
        var shim2 = views.build(element);
        (<any>shim2).getData = () =>{
            return {};
        };
        return <Model<T>>shim2;
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

    public setPrototype(proto: any): void { }
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

    /**
     * Set the prototype object to use when getting data.
     * When the new object is created it will use this as
     * its prototype.
     */
    setPrototype(proto: T): void;
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

    public setPrototype(proto: T): void { 
        this.childModel.setPrototype(proto);
    }
}