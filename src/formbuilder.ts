"use strict";

///<amd-module name="hr.formbuilder"/>

import * as component from 'hr.components';
import * as domquery from 'hr.domquery';
import { BindingCollection, PooledBindings } from 'hr.bindingcollection';
import * as view from 'hr.view';
import * as event from 'hr.eventdispatcher';

export interface JsonSchema {
    title?: string;
    type?: string;
    additionalProperties?: boolean;
    properties?: JsonPropertyMap;
}

export interface JsonProperty {
    title?: string;
    type?: string | string[];
    format?: string;
    items?: JsonSchema;
    "x-ui-order"?: number;
    "x-ui-type"?: string;
    "x-values"?: JsonLabel[];
    enum?: string[];
    "x-enumNames"?: string[];
}

export interface ProcessedJsonProperty extends JsonProperty {
    buildName: string;
    buildType: string;
    buildOrder: number;
    buildValues?: JsonLabel[];
    size?: number;
}

export type JsonPropertyMap = { [key: string]: JsonProperty };

export interface JsonLabel {
    label: string;
    value: any;
}

export interface FormSerializer {
    serialize: (level?: string) => any;
    populate: (data: any, level?: string) => void;
}

export class SpecialFormValues{
    private special: ISpecialFormValue[] = [];

    public add(value: ISpecialFormValue): void {
        this.special.push(value);
    }

    public setData(data: any, serializer: FormSerializer): void {
        for(var i = 0; i < this.special.length; ++i){
            this.special[i].setData(data, serializer);
        }
    }

    public recoverData(data: any, serializer: FormSerializer): void {
        for(var i = 0; i < this.special.length; ++i){
            var item = this.special[i];
            var subData = item.getData(serializer);
            data[item.getName()] = subData;
        }
    }
}

export interface ISpecialFormValue{
    getName(): string;

    getData(serializer: FormSerializer): any;

    setData(data: any, serializer: FormSerializer);
}

const indexMax = 2147483647;//Sticking with 32 bit;

class InfiniteIndex{
    private num: number = 0;
    private base: string = "";

    public getNext(): string {
        ++this.num;
        if(this.num === indexMax){
            this.base += "-"; //Each time we hit index max we just add a - to the base
            this.num = 0;
        }
        return this.base + this.num;
    }
}

class ArrayEditorRow {
    private pooled: PooledBindings;
    private removed = new event.ActionEventDispatcher<ArrayEditorRow>();

    constructor(private bindings: BindingCollection, schema: JsonSchema, private name: string){
        buildForm('hr.defaultform', schema, this.bindings.rootElement, this.name, true);

        bindings.setListener(this);
    }

    public get onRemoved(): event.EventModifier<event.ActionEventListener<ArrayEditorRow>>{
        return this.removed.modifier;
    }

    public remove(evt: Event): void{
        evt.preventDefault();
        this.pooled = this.bindings.pool();
        this.removed.fire(this);
    }

    public restore(){
        if(this.pooled) {
            this.pooled.restore(null);
        }
    }

    public getData(serializer: FormSerializer): any {
        return serializer.serialize(this.name);
    }

    public setData(data: any, serializer: FormSerializer) {

    }
}

class ArrayEditor implements ISpecialFormValue {
    private itemsView: view.IView<JsonSchema>;
    private pooledRows: ArrayEditorRow[] = [];
    private rows: ArrayEditorRow[] = [];
    private indexGen: InfiniteIndex = new InfiniteIndex();
    private isSimple: boolean;

    constructor(private name: string, bindings: BindingCollection, private schema: JsonSchema){
        this.itemsView = bindings.getView<JsonSchema>("items");
        bindings.setListener(this);
        this.isSimple = schema.type !== "object";
    }

    public add(evt: Event): void {
        evt.preventDefault();
        if(this.pooledRows.length == 0){
            this.itemsView.appendData(this.schema, (bindings, data) => {
                var row = new ArrayEditorRow(bindings, data, this.name + '-' + this.indexGen.getNext());
                row.onRemoved.add((r) =>{
                    this.rows.splice(this.rows.indexOf(r), 1); //It will always be there
                    this.pooledRows.push(r);
                });
                this.rows.push(row);
            });
        }
        else{
            var row = this.pooledRows.pop();
            row.restore();
            this.rows.push(row);
        }
    }

    public getData(serializer: FormSerializer): any {
        var items = [];
        for(var i = 0; i < this.rows.length; ++i){
            var data = this.rows[i].getData(serializer);
            if(this.isSimple){
                data = data[""];
            }
            items.push(data);
        }
        return items;
    }

    public setData(data: any, serializer: FormSerializer) {
        for(var i = 0; i < this.rows.length; ++i){
            this.rows[i].setData(data, serializer);
        }
    }

    public getName(): string{
        return this.name;
    }
}

export function buildForm(componentName: string, schema: JsonSchema, parentElement: HTMLElement, baseName?: string, ignoreExisting?: boolean): SpecialFormValues {
    ////Clear existing elements
    //while (formElement.lastChild) {
    //    formElement.removeChild(formElement.lastChild);
    //}
    var specialValues = new SpecialFormValues();

    if(ignoreExisting === undefined){
        ignoreExisting = false;
    }

    if(baseName === undefined){
        baseName = "";
    }
    
    var dynamicInsertElement = domquery.first("[data-hr-form-end]", parentElement);
    var propArray: ProcessedJsonProperty[] = [];
    var props = schema.properties;
    if(props === undefined){
        //No props, add the schema itself as a property
        propArray.push(processProperty(schema, baseName, baseName));
    }
    else {
        
        var baseNameWithSep = baseName;
        if(baseNameWithSep !== ""){
            baseNameWithSep = baseNameWithSep + '-';
        }

        for(var key in props){
            propArray.push(processProperty(props[key], baseNameWithSep + key, key));
        }

        propArray.sort((a, b) =>{
            return a.buildOrder - b.buildOrder;
        });
    }

    for(var i = 0; i < propArray.length; ++i){
            var item = propArray[i];
            var existing = domquery.first('[name=' + item.buildName + ']', parentElement);
            if(ignoreExisting || existing === null){
                //Create component if it is null
                var bindings = component.one(componentName, item, parentElement, dynamicInsertElement, undefined, (i) => {
                    return i.buildType;
                });

                //Refresh existing, should be found now, when doing this always grab the last match.
                var elements = domquery.all('[name=' + item.buildName + ']', parentElement);
                if(elements.length > 0){
                    existing = elements[elements.length - 1];
                }
                else{
                    existing = null;
                }

                if(item.buildType === "arrayEditor"){
                    var editor = new ArrayEditor(item.buildName, bindings, item.items);
                    specialValues.add(editor);
                }
            }

            //If this is a child form, mark the element as a child so the form serializer will ignore it
            if(IsElement(existing)){
                existing.setAttribute("data-hr-form-level", baseName);
            }

            //If there are values defined for the element, put them on the page, this works for both
            //predefined and generated elements, which allows you to have predefined selects that can have dynamic values
            if(item.buildValues !== undefined){
                if(IsSelectElement(existing)){
                    for(var q = 0; q < item.buildValues.length; ++q){
                        var current = item.buildValues[q];
                        var option = document.createElement("option");
                        option.text = current.label;
                        option.value = current.value;
                        existing.options.add(option);
                    }
                }
            }
        }

    return specialValues;
}

function IsElement(element: Node): element is HTMLElement{
    return element && (element.nodeName !== undefined);
}

function IsSelectElement(element: Node): element is HTMLSelectElement{
    return element && (element.nodeName === 'SELECT');
}

function extractLabels(prop: JsonProperty): JsonLabel[]{
    var values: JsonLabel[] = [];
    var theEnum = prop.enum;
    var enumNames = theEnum;
    if(prop["x-enumNames"] !== undefined){
        enumNames = prop["x-enumNames"];
    }
    for(var i = 0; i < theEnum.length; ++i){
        values.push({
            label: enumNames[i],
            value: theEnum[i]
        });
    }
    return values;
}

function processProperty(prop: JsonProperty, name: string, defaultTitle: string): ProcessedJsonProperty{
    var processed = Object.create(prop);
    processed.buildName = name;
    if(processed.title === undefined){ //Set title if it is not set
        processed.title = defaultTitle;
    }

    if(prop["x-ui-order"] !== undefined){
        processed.buildOrder = prop["x-ui-order"];
    }
    else{
        processed.buildOrder = Number.MAX_VALUE;
    }

    //Set this build type to what has been passed in, this will be processed further below
    processed.buildType = getPropertyType(prop).toLowerCase();

    if(prop["x-values"] !== undefined){
        processed.buildValues = prop["x-values"];
    }
    else if(prop.enum !== undefined){
        processed.buildValues = extractLabels(prop);
    }

    //Look for collections, anything defined as an array or that has x-values defined
    if(processed.buildType === 'array'){
        if(processed.buildValues !== undefined) {
            //Only supports checkbox and multiselect ui types. Checkboxes have to be requested.
            if(prop["x-ui-type"] === "checkbox"){
                //Nothing for checkboxes yet, just be a basic multiselect until they are implemented
                processed.buildType = "multiselect";
            }
            else{
                processed.buildType = "multiselect";
                processed.size = processed.buildValues.length;
                if(processed.size > 15){
                    processed.size = 15;
                }
            }
        }
        else{
            //Array of complex objects, since values are not provided
            processed.buildType = "arrayEditor";
        }
    }
    else{
        if(processed.buildValues !== undefined) {
            if(prop["x-ui-type"] !== undefined){
                processed.buildType = prop["x-ui-type"];
            }
            else{
                processed.buildType = "select";
            }
        }
        else
        {
            //Regular type, no options, derive html type
            if(prop["x-ui-type"] !== undefined){
                processed.buildType = prop["x-ui-type"];
            }
            else{
                switch(processed.buildType){
                    case 'integer':
                        processed.buildType = 'number';
                        break;
                    case 'boolean':
                        processed.buildType = 'checkbox';
                        break;
                }
            }
        }
    }

    return processed;
}

function getPropertyType(prop: JsonProperty) {
    if (Array.isArray(prop.type)) {
        for (var j = 0; j < prop.type.length; ++j) {
            if (prop.type[j] !== "null") {
                return prop.type[j];
            }
        }
    }
    else {
        return prop.type;
    }
    return "null";
}