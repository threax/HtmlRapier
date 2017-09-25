///<amd-module name="hr.formhelper"/>

import * as domQuery from 'hr.domquery';
import * as typeIds from 'hr.typeidentifiers';
import { JsonSchema } from 'hr.schema';
import { FormErrors } from 'hr.error';

export function IsFormElement(element: Node): element is HTMLFormElement{
    return element && (element.nodeName === 'FORM' || element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA');
}

function addValue(q: {}, name: string, value: any, level: string) {
    if(value === undefined || value === ""){
        return; //Prevents empty strings and undefined from being added to the output object
    }

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
export function serialize(form: HTMLElement, proto?: any, level?: string): any {
    //This is from https://code.google.com/archive/p/form-serialize/downloads
    //Modified to return an object instead of a query string

    var formElements;
    if (IsFormElement(form)) {
        formElements = form.elements;
    }
    else{
        formElements = domQuery.all("[name]", form); //All elements with a name, they will be filtered by what is supported below
    }
    var i, j, q = Object.create(proto || null);
    var elementsLength = formElements.length;
    for (i = 0; i < elementsLength; ++i) {
        var element: any = formElements[i];

        if (element.name === "" || !allowWrite(element, level)) {
            continue;
        }
        var value = readValue(element);
        if(value !== undefined){
            addValue(q, element.name, value, level);
        }
    }
    return q;
}

export function readValue(element: any): any{
    switch (element.nodeName) {
        case 'INPUT':
            switch (element.type) {
                case 'file':
                    var file = element.files;
                    if(!element.hasAttribute("multiple") && file.length > 0){
                        file = file[0];
                    }
                    return file;
                case 'checkbox':
                case 'radio':
                    if (element.checked) {
                        return element.value;
                    }
                    break;
                default:
                    return element.value;
            }
            break;
        case 'TEXTAREA':
            return element.value;
        case 'SELECT':
            switch (element.type) {
                case 'select-one':
                    return element.value;
                case 'select-multiple':
                    var selected: string[] = [];
                    for (var j = element.options.length - 1; j >= 0; j = j - 1) {
                        var option = element.options[j];
                        if (option.selected && option.value !== "") {
                            selected.push(element.options[j].value);
                        }
                    }
                    if(selected.length > 0) {
                        return selected;
                    }
                    break;
            }
            break;
        case 'BUTTON':
            switch (element.type) {
                case 'reset':
                case 'submit':
                case 'button':
                    return element.value;
            }
            break;
    }
    return undefined;
}

export enum DataType{
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

export function getDataType(data: any): DataType{
    if (typeIds.isObject(data)) {
        return DataType.Object;
    }
    else if (typeIds.isFunction(data)) {
        return DataType.Function;
    }
}

/**
 * Populate a form with data.
 * @param form - The form to populate or a query string for the form.
 * @param data - The data to bind to the form, form name attributes will be mapped to the keys in the object.
 */
export function populate(form: HTMLElement | string, data:any, level?: string): void {
    var formElement = <HTMLElement>domQuery.first(form);
    var nameAttrs = domQuery.all('[name]', formElement);
    var dataType: DataType = getDataType(data);

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
                    if(Array.isArray(itemData)){
                        for (var j = options.length - 1; j >= 0; j = j - 1) {
                            options[j].selected = containsCoerced(itemData, options[j].value);
                        }
                    }
                    break;
                case 'select-one':
                    if (itemData === null || itemData === undefined) {
                        element.value = "";
                    }
                    else {
                        element.value = itemData;
                    }
                    break;
                default:
                    element.value = itemData;
                    break;
            }
        }
    }
}

export interface IFormSerializer {
    serialize: (level?: string) => any;
    populate: (data: any, level?: string) => void;
}

export class FormSerializer implements IFormSerializer{
    constructor(private form: HTMLFormElement){

    }

    public serialize(level?: string): any {
        return serialize(this.form, undefined, level);
    }

    public populate(data: any, level?: string): void {
        populate(this.form, data, level);
    }
}

export interface IFormValues{
    setError(err: FormErrors): void;

    setData(data: any, serializer: IFormSerializer): void;

    recoverData(proto: {} | null): any;

    changeSchema(componentName: string, schema: JsonSchema, parentElement: HTMLElement): void;
}

export type BuildFormFunc = (componentName: string, schema: JsonSchema, parentElement: HTMLElement) => IFormValues;

var buildFormCb: BuildFormFunc;

export function setBuildFormFunc(buildForm: BuildFormFunc){
    buildFormCb = buildForm;
}

export function buildForm(componentName: string, schema: JsonSchema, parentElement: HTMLElement): IFormValues{
    return buildFormCb(componentName, schema, parentElement);
}

class ClearingValidator implements FormErrors{
    public name;
    public message = "";
    public stack?;

    /**
     * Get the validation error named name.
     */
    getValidationError(name: string): string | undefined{
        return undefined;
    }

    /**
     * Check to see if a named validation error exists.
     */
    hasValidationError(name: string): boolean{
        return false;
    }

    /**
     * Get all validation errors.
     */
    getValidationErrors() {
        return {};
    }

    /**
     * Determine if there are any validation errors.
     */
    hasValidationErrors() : boolean{
        return true;
    }

    addKey(baseName: string, key: string): string{
        return "";
    }

    addIndex(baseName: string, key: string, index: string | number): string{
        return "";
    }
}

var sharedClearingValidator = new ClearingValidator();

/**
 * Get a shared instance of a validator that will clear all data passed in.
 */
export function getSharedClearingValidator(): FormErrors {
    return sharedClearingValidator;
}