///<amd-module name="hr.form"/>

"use strict";

import * as domQuery from 'hr.domquery';
import * as typeIds from 'hr.typeidentifiers';
import * as formBuilder from 'hr.formbuilder';

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

    /**
     * Set the schema for this form. This will add any properties found in the
     * schema that you did not already define on the form. It will match the form
     * property names to the name attribute on the elements. If you had a blank form
     * this would generate the whole thing for you from the schema.
     */
    setSchema(schema: formBuilder.JsonSchema, componentName?: string): void;
}

class Form<T> {
    private proto: T;
    private baseLevel: string = undefined;
    private specialValues: formBuilder.SpecialFormValues;
    private formSerializer: Serializer;

    constructor(private form: HTMLFormElement) {

    }
    
    public setData(data: T) {
        populate(this.form, data, this.baseLevel);
        if(this.specialValues) {
            this.specialValues.setData(data, this.formSerializer);
        }
    }

    public clear() {
        populate(this.form, sharedClearer);
    }

    public getData(): T {
        var data = <T>serialize(this.form, this.proto, this.baseLevel);
        if(this.specialValues) {
            this.specialValues.recoverData(data, this.formSerializer);
        }
        return data;
    }

    public setPrototype(proto: T): void { 
        this.proto = proto;
    }

    public setSchema(schema: formBuilder.JsonSchema, componentName?: string): void{
        if(componentName === undefined){
            componentName = "hr.defaultform";
        }
        this.specialValues = formBuilder.buildForm(componentName, schema, this.form);
        this.baseLevel = "";
        this.formSerializer = new Serializer(this.form);
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

    public setSchema(schema: formBuilder.JsonSchema, componentName?: string): void{

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

function addValue(q: {}, name: string, value: any, level: string) {
    name = extractLevelName(level, name);

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

function allowWrite(element: HTMLElement, level: string): boolean{
    return level === undefined || element.getAttribute('data-hr-form-level') === level;
}

/**
 * Serialze a form to a javascript object
 * @param form - A selector or form element for the form to serialize.
 * @returns - The object that represents the form contents as an object.
 */
function serialize(form: HTMLFormElement, proto?: any, level?: string): any {
    //This is from https://code.google.com/archive/p/form-serialize/downloads
    //Modified to return an object instead of a query string
    //form = domQuery.first(form);

    if (!IsFormElement(form)) {
        return;
    }
    var i, j, q = Object.create(proto || null);
    var elementsLength = form.elements.length;
    for (i = 0; i < elementsLength; ++i) {
        var element: any = form.elements[i];

        if (element.name === "" || !allowWrite(element, level)) {
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
                    case 'date':
                    case 'submit':
                        addValue(q, element.name, element.value, level);
                        break;
                    case 'file':
                        addValue(q, element.name, element.files, level);
                        break;
                    case 'checkbox':
                    case 'radio':
                        if (element.checked) {
                            addValue(q, element.name, element.value, level);
                        }
                        break;
                }
                break;
            case 'TEXTAREA':
                addValue(q, element.name, element.value, level);
                break;
            case 'SELECT':
                switch (element.type) {
                    case 'select-one':
                        addValue(q, element.name, element.value, level);
                        break;
                    case 'select-multiple':
                        for (j = element.options.length - 1; j >= 0; j = j - 1) {
                            if (element.options[j].selected) {
                                addValue(q, element.name, element.options[j].value, level);
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
                        addValue(q, element.name, element.value, level);
                        break;
                }
                break;
        }
    }
    return q;
}

enum DataType{
    Object,
    Function
}

function containsCoerced(items: any[], search: any){
    for(var i = 0; i < items.length; ++i){
        if(items[i] == search){
            return true;
        }
    }
    return false;
}

function extractLevelName(level: string, name: string): string{
    if(level !== undefined && level !== null && level.length > 0){
        name = name.substring(level.length + 1); //Account for delimiter, but we don't care what it is
    }
    return name;
}

/**
 * Populate a form with data.
 * @param form - The form to populate or a query string for the form.
 * @param data - The data to bind to the form, form name attributes will be mapped to the keys in the object.
 */
function populate(form: HTMLElement | string, data:any, level?: string): void {
    var formElement = domQuery.first(form);
    var nameAttrs = domQuery.all('[name]', <HTMLElement>formElement);

    var getData: (key: string) => any;

    var dataType: DataType;
    if (typeIds.isObject(data)) {
        dataType = DataType.Object;
    }
    else if (typeIds.isFunction(data)) {
        dataType = DataType.Function;
    }

    for (var i = 0; i < nameAttrs.length; ++i) {
        var element = nameAttrs[i] as HTMLInputElement | HTMLSelectElement;

        if(allowWrite(element, level)){
            var itemData: any;
            var dataName = extractLevelName(level, element.getAttribute('name'));
            switch(dataType){
                case DataType.Object:
                    itemData = data[dataName];
                    break;
                case DataType.Function:
                    itemData = data(dataName);
                    break;
            }
            
            if(itemData === undefined){
                itemData = "";
            }

            switch (element.type) {
                case 'checkbox':
                    (<HTMLInputElement>element).checked = itemData;
                    break;
                case 'select-multiple':
                    var options = (<HTMLSelectElement>element).options;
                    for (var j = options.length - 1; j >= 0; j = j - 1) {
                        options[j].selected = containsCoerced((<any[]>itemData), options[j].value);
                    }
                    break;
                default:
                    element.value = itemData;
                    break;
            }
        }
    }
}

function sharedClearer(i: number) {
    return "";
}

class Serializer implements formBuilder.FormSerializer{
    constructor(private form: HTMLFormElement){

    }

    public serialize(level?: string): any {
        return serialize(this.form, undefined, level);
    }

    public populate(data: any, level?: string): void {
        populate(this.form, data, level);
    }
}