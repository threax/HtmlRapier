﻿"use strict";

import * as formHelper from './formhelper';
import { JsonSchema } from './schema';
import { FormErrors } from './error';
import * as events from './eventdispatcher';

export interface IFormArgs<T> {
    source: IForm<T>;
    data: T;
}

export interface IFormGetArgs<T> {
    source: IForm<T>;
}

export interface IFormChangedArgs<T> {
    source: IForm<T>;
    propertyName: string | null;
}

export interface IForm<T> {
    /**
     * Called before data is set. Will also be called on clear.
     */
    onBeforeSetData: events.EventModifier<events.ActionEventListener<IFormArgs<T>>>;

    /**
     * Called after data is set. Will also be called on clear.
     */
    onAfterSetData: events.EventModifier<events.ActionEventListener<IFormArgs<T>>>;

    /**
     * Called before data is recovered from the form.
     */
    onBeforeGetData: events.EventModifier<events.ActionEventListener<IFormGetArgs<T>>>;

    /**
     * Called after data is recovered from the form.
     */
    onAfterGetData: events.EventModifier<events.ActionEventListener<IFormArgs<T>>>;

    /**
     * Called when form data changes, either from an individual item changing or the entire
     * form having its data set or cleared.
     */
    onChanged: events.EventModifier<events.ActionEventListener<IFormChangedArgs<T>>>;

    /**
     * Set the error currently on the form. Will match property names to form values and display the errors.
     */
    setError(err: FormErrors): void;

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
     * Get the data on the form. You can pass existing data that will be extended.
     */
    getData(exising?: T): T;

    /**
     * Get a single value from the form, useful in change events
     * to avoid serializing the entire form to a new piece of data
     * just to lookup 1 value.
     */
    getValue(name: string);

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

    public setError(err: FormErrors) {
        this.wrapped.setError(err);
    }

    public clearError(): void{
        this.wrapped.clearError();
    }

    public setData(data: T): void {
        if(this.loadedSchema){
            this.wrapped.setData(data);
        }
        else{
            this.waitingData = data;
        }
    }

    public clear(): void {
        this.wrapped.clear();
    }

    public getData(exising?: T): T {
        return this.wrapped.getData(exising);
    }

    public getValue(name: string) {
        return this.wrapped.getValue(name);
    }

    public setSchema(schema: JsonSchema, componentName?: string): void {
        this.wrapped.setSchema(schema, componentName);
        if(this.waitingData !== undefined){
            this.wrapped.setData(this.waitingData);
            this.waitingData = undefined;
        }
        this.loadedSchema = true;
    }

    public get onBeforeSetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.wrapped.onBeforeSetData;
    }

    public get onAfterSetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.wrapped.onAfterSetData;
    }

    public get onBeforeGetData(): events.EventModifier<events.ActionEventListener<IFormGetArgs<T>>> {
        return this.wrapped.onBeforeGetData;
    }

    public get onAfterGetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.wrapped.onAfterGetData;
    }

    public get onChanged(): events.EventModifier<events.ActionEventListener<IFormChangedArgs<T>>> {
        return this.wrapped.onChanged;
    }
}

class Form<T> implements IForm<T> {
    private baseLevel: string = undefined;
    private formValues: formHelper.IFormValues;
    private beforeSetDataEvent = new events.ActionEventDispatcher<IFormArgs<T>>();
    private afterSetDataEvent = new events.ActionEventDispatcher<IFormArgs<T>>();
    private beforeGetDataEvent = new events.ActionEventDispatcher<IFormGetArgs<T>>();
    private afterGetDataEvent = new events.ActionEventDispatcher<IFormArgs<T>>();
    private onChangedEvent = new events.ActionEventDispatcher<IFormChangedArgs<T>>();

    constructor(private form: HTMLFormElement) {

    }

    public setError(err: FormErrors) {
        if(this.formValues){
            this.formValues.setError(err);
        }
    }

    public clearError(){
        if(this.formValues){
            this.formValues.setError(formHelper.getSharedClearingValidator());
        }
    }
    
    public setData(data: T) {
        this.beforeSetDataEvent.fire({
            data: data,
            source: this
        });
        if(this.formValues) {
            this.formValues.setData(data);
            this.formValues.fireDataChanged();
        }
        else {
            formHelper.populate(this.form, data, this.baseLevel);
        }
        this.afterSetDataEvent.fire({
            data: data,
            source: this
        });
        this.clearError();
    }

    public clear() {
        this.clearError();
        if(this.formValues) {
            this.formValues.setData(sharedClearer);
            this.formValues.fireDataChanged();
        }
        else {
            formHelper.populate(this.form, sharedClearer);
        }
    }

    public getData(exising?: T): T {
        this.beforeGetDataEvent.fire({
            source: this
        });
        var data: T;
        if (this.formValues) { //If there are form values, use them to read the data.
            data = this.formValues.recoverData(exising);
        }
        else { //Otherwise read the form raw
            data = formHelper.serialize(this.form, this.baseLevel, exising);
        }

        this.afterGetDataEvent.fire({
            data: data,
            source: this
        });

        for(var key in data){ //This will pass if there is a key in data, ok to also check prototype, if user set it they want it.
            return data;
        }
        return null; //Return null if the data returned has no keys in it, which means it is empty.
    }

    public getValue(name: string) {
        if (this.formValues) {
            var formValue = this.formValues.getFormValue(name);
            if (formValue) {
                return formValue.getData();
            }
        }
        else {
            //Since there is no formvalues, we must serialize the entire form and return the result.
            var data = formHelper.serialize<T>(this.form, this.baseLevel);
            return data[name];
        }

        return undefined;
    }

    public setSchema(schema: JsonSchema, componentName?: string): void{
        if (componentName === undefined) {
            componentName = this.form.getAttribute("data-hr-form-component");
            if (componentName === null) {
                componentName = "hr.forms.default";
            }
        }

        this.clear();

        if(this.formValues){
            this.formValues.changeSchema(componentName, schema, this.form);
        }
        else{
            this.formValues = formHelper.buildForm(componentName, schema, this.form);
            this.baseLevel = "";
            this.formValues.onChanged.add(a =>
                this.onChangedEvent.fire({ source: this, propertyName: a.propertyName }));
        }

        this.formValues.fireDataChanged();
    }

    public get onBeforeSetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.beforeSetDataEvent.modifier;
    }

    public get onAfterSetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.afterSetDataEvent.modifier;
    }

    public get onBeforeGetData(): events.EventModifier<events.ActionEventListener<IFormGetArgs<T>>> {
        return this.beforeGetDataEvent.modifier;
    }

    public get onAfterGetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.afterGetDataEvent.modifier;
    }

    public get onChanged(): events.EventModifier<events.ActionEventListener<IFormChangedArgs<T>>> {
        return this.onChangedEvent.modifier;
    }
}

class NullForm<T> implements IForm<T> {
    private beforeSetDataEvent = new events.ActionEventDispatcher<IFormArgs<T>>();
    private afterSetDataEvent = new events.ActionEventDispatcher<IFormArgs<T>>();
    private beforeGetDataEvent = new events.ActionEventDispatcher<IFormGetArgs<T>>();
    private afterGetDataEvent = new events.ActionEventDispatcher<IFormArgs<T>>();
    private onChangedEvent = new events.ActionEventDispatcher<IFormChangedArgs<T>>();

    constructor(){

    }

    public setError(err: FormErrors) {
        
    }

    public clearError(): void{

    }

    public setData(data): void {
        
    }

    public getValue(name: string) {
        return undefined;
    }

    public clear(): void {
        
    }

    public getData(exising?: T) {
        return <T>null;
    }

    public setSchema(schema: JsonSchema, componentName?: string): void{

    }

    public get onBeforeSetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.beforeSetDataEvent.modifier;
    }

    public get onAfterSetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.afterSetDataEvent.modifier;
    }

    public get onBeforeGetData(): events.EventModifier<events.ActionEventListener<IFormGetArgs<T>>> {
        return this.beforeGetDataEvent.modifier;
    }

    public get onAfterGetData(): events.EventModifier<events.ActionEventListener<IFormArgs<T>>> {
        return this.afterGetDataEvent.modifier;
    }

    public get onChanged(): events.EventModifier<events.ActionEventListener<IFormChangedArgs<T>>> {
        return this.onChangedEvent.modifier;
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