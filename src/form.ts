///<amd-module name="hr.form"/>

"use strict";

import * as formHelper from 'hr.formhelper';
import { JsonSchema } from 'hr.schema';
import { ValidationError } from 'hr.error';

export interface IForm<T> {
    /**
     * Set the error currently on the form. Will match property names to form values and display the errors.
     */
    setError(err: ValidationError): void;

    /**
     * Clear any error messages on the form.
     */
    clearError(): void;

     /**
      * Set the data on the form.
      * @param data The data to set.
      */
    setData(data: T): void;

    /**
     * Remove all data and error messages from the form.
     */
    clear(): void;

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
    setSchema(schema: JsonSchema, componentName?: string): void;
}

/**
 * This form decorator will ensure that a schema is loaded before any data is added to the
 * form. You can call setData and setSchema in any order you want, but the data will not
 * be set until the schema is loaded. Just wrap your real IForm in this decorator to get this
 * feature.
 */
export class NeedsSchemaForm<T> implements IForm<T> {
    private loadedSchema: boolean = false;
    private waitingData: T;

    constructor(private wrapped: IForm<T>){

    }

    public setError(err: ValidationError) {
        this.wrapped.setError(err);
    }

    public clearError(): void{
        this.wrapped.clearError();
    }

    /**
      * Set the data on the form.
      * @param data The data to set.
      */
    public setData(data: T): void {
        if(this.loadedSchema){
            this.wrapped.setData(data);
        }
        else{
            this.waitingData = data;
        }
    }

    /**
     * Remove all data from the form.
     */
    public clear(): void {
        this.wrapped.clear();
    }

    /**
     * Get the data on the form. If you set a prototype
     * it will be used as the prototype of the returned
     * object.
     */
    public getData(): T {
        return this.wrapped.getData();
    }

    /**
     * Set the prototype object to use when getting the
     * form data with getData.
     * @param proto The prototype object.
     */
    public setPrototype(proto: T): void {
        this.wrapped.setPrototype(proto);
    }

    /**
     * Set the schema for this form. This will add any properties found in the
     * schema that you did not already define on the form. It will match the form
     * property names to the name attribute on the elements. If you had a blank form
     * this would generate the whole thing for you from the schema.
     */
    public setSchema(schema: JsonSchema, componentName?: string): void {
        this.wrapped.setSchema(schema, componentName);
        if(this.waitingData !== undefined){
            this.wrapped.setData(this.waitingData);
            this.waitingData = undefined;
        }
        this.loadedSchema = true;
    }
}

class ClearingValidator implements ValidationError{
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
}

var sharedClearingValidator = new ClearingValidator();

class Form<T> {
    private proto: T;
    private baseLevel: string = undefined;
    private specialValues: formHelper.IFormValues;
    private formSerializer: formHelper.IFormSerializer;

    constructor(private form: HTMLFormElement) {

    }

    public setError(err: ValidationError) {
        if(this.specialValues){
            this.specialValues.setError(err);
        }
    }

    public clearError(){
        if(this.specialValues){
            this.specialValues.setError(sharedClearingValidator);
        }
    }
    
    public setData(data: T) {
        formHelper.populate(this.form, data, this.baseLevel);
        if(this.specialValues) {
            this.specialValues.setData(data, this.formSerializer);
        }
    }

    public clear() {
        this.clearError();
        formHelper.populate(this.form, sharedClearer);
    }

    public getData(): T {
        var data = <T>formHelper.serialize(this.form, this.proto, this.baseLevel);
        if(this.specialValues) {
            this.specialValues.recoverData(data, this.formSerializer);
        }
        for(var key in data){ //This will pass if there is a key in data, ok to also check prototype, if user set it they want it.
            return data;
        }
        return null; //Return null if the data returned has no keys in it, which means it is empty.
    }

    public setPrototype(proto: T): void { 
        this.proto = proto;
    }

    public setSchema(schema: JsonSchema, componentName?: string): void{
        if(componentName === undefined){
            componentName = "hr.defaultform";
        }
        this.specialValues = formHelper.buildForm(componentName, schema, this.form);
        this.baseLevel = "";
        this.formSerializer = new formHelper.FormSerializer(this.form);
    }
}

class NullForm<T> implements IForm<T> {
    constructor(){

    }

    public setError(err: ValidationError) {
        
    }

    public clearError(): void{

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

    public setSchema(schema: JsonSchema, componentName?: string): void{

    }
}

/**
 * Create a new form element. 
 * @param element 
 */
export function build<T>(element: Node) : IForm<T> {
    if(formHelper.IsFormElement(element)){
        return new Form<T>(element);
    }
    return new NullForm<T>();
}

function sharedClearer(i: number) {
    return "";
}