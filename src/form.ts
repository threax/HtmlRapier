"use strict";

import * as domQuery from 'hr.domquery';
import * as typeIds from 'hr.typeidentifiers';

export interface IForm<T> {    
     /**
      * Set the data on the form.
      * @param data The data to set.
      */
    setData(data: T);

    /**
     * Remove all data from the form.
     */
    clear();

    /**
     * Get the data on the form. If you set a prototype
     * it will be used as the prototype of the returned
     * object.
     */
    getData(): T;

    /**
     * Set the prototype object to use when getting the
     * form data with getData.
     * @param proto The prototype object.
     */
    setPrototype(proto: T): void;
}

class Form<T> {
    private proto: T;

    constructor(private form: HTMLFormElement) {

    }
    
    public setData(data: T) {
        populate(this.form, data);
    }

    public clear() {
        populate(this.form, sharedClearer);
    }

    public getData(): T {
        return <T>serialize(this.form, this.proto);
    }

    public setPrototype(proto: T): void { 
        this.proto = proto;
    }
}

class NullForm<T> implements IForm<T> {
    constructor(){

    }

    public setData(data): void {

    }

    public clear(): void {

    }

    public getData() {
        return <T>null;
    }

    public setPrototype(proto: T): void { 

    }
}

/**
 * Create a new form element. 
 * @param element 
 */
export function build<T>(element: Node) : IForm<T> {
    if(IsFormElement(element)){
        return new Form<T>(element);
    }
    return new NullForm<T>();
}

function IsFormElement(element: Node): element is HTMLFormElement{
    return element && (element.nodeName === 'FORM' || element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA');
}

function addValue(q, name, value) {
    if (q[name] === undefined) {
        q[name] = value;
    }
    else if (!typeIds.isArray(q[name])) {
        var tmp = q[name];
        q[name] = [tmp, value];
    }
    else {
        q[name].push(value);
    }
}

/**
 * Serialze a form to a javascript object
 * @param {HTMLElement|string} form - A selector or form element for the form to serialize.
 * @returns {object} - The object that represents the form contents as an object.
 */
function serialize(form: HTMLFormElement, proto?: any) {
    //This is from https://code.google.com/archive/p/form-serialize/downloads
    //Modified to return an object instead of a query string
    //form = domQuery.first(form);

    if (!IsFormElement(form)) {
        return;
    }
    var i, j, q = Object.create(proto || null);
    for (i = form.elements.length - 1; i >= 0; i = i - 1) {
        var element: any = form.elements[i];

        if (element.name === "") {
            continue;
        }
        switch (element.nodeName) {
            case 'INPUT':
                switch (element.type) {
                    case 'text':
                    case 'hidden':
                    case 'password':
                    case 'button':
                    case 'reset':
                    case 'submit':
                        addValue(q, element.name, element.value);
                        break;
                    case 'file':
                        addValue(q, element.name, element.files);
                        break;
                    case 'checkbox':
                    case 'radio':
                        if (element.checked) {
                            addValue(q, element.name, element.value);
                        }
                        break;
                }
                break;
            case 'TEXTAREA':
                addValue(q, element.name, element.value);
                break;
            case 'SELECT':
                switch (element.type) {
                    case 'select-one':
                        addValue(q, element.name, element.value);
                        break;
                    case 'select-multiple':
                        for (j = element.options.length - 1; j >= 0; j = j - 1) {
                            if (element.options[j].selected) {
                                addValue(q, element.name, element.options[j].value);
                            }
                        }
                        break;
                }
                break;
            case 'BUTTON':
                switch (element.type) {
                    case 'reset':
                    case 'submit':
                    case 'button':
                        addValue(q, element.name, element.value);
                        break;
                }
                break;
        }
    }
    return q;
}

/**
 * Populate a form with data.
 * @param {HTMLElement|string} form - The form to populate or a query string for the form.
 * @param {object} data - The data to bind to the form, form name attributes will be mapped to the keys in the object.
 */
function populate(form: HTMLElement | string, data:any) {
    var formElement = domQuery.first(form);
    var nameAttrs = domQuery.all('[name]', <HTMLElement>formElement);
    if (typeIds.isObject(data)) {
        for (var i = 0; i < nameAttrs.length; ++i) {
            var element = nameAttrs[i] as HTMLInputElement;

            switch (element.type) {
                case 'checkbox':
                    element.checked = data[element.getAttribute('name')];
                    break;
                default:
                    element.value = data[element.getAttribute('name')];
                    break;
            }
        }
    }
    else if (typeIds.isFunction(data)) {
        for (var i = 0; i < nameAttrs.length; ++i) {
            var element = nameAttrs[i] as HTMLInputElement;

            switch (element.type) {
                case 'checkbox':
                    element.checked = data(element.getAttribute('name'));
                    break;
                default:
                    element.value = data(element.getAttribute('name'));
                    break;
            }
        }
    }
}

function sharedClearer(i: number) {
    return "";
}