///<amd-module name="hr.formbuilder"/>

"use strict";

import * as component from 'hr.components';
import * as domquery from 'hr.domquery';
import { BindingCollection, PooledBindings } from 'hr.bindingcollection';
import * as view from 'hr.view';
import * as toggle from 'hr.toggles';
import * as event from 'hr.eventdispatcher';
import * as formHelper from 'hr.formhelper';
import { JsonProperty, JsonLabel, JsonSchema, resolveRef, RefNode } from 'hr.schema';

interface ProcessedJsonProperty extends JsonProperty {
    buildName: string;
    buildType: string;
    buildOrder: number;
    buildValues?: JsonLabel[]; //The values if there are multiple value choices, e.g. combo boxes
    size?: number;
    buildValue?: string; //The value if there is a single value for this item, e.g. checkboxes
}

class FormValues implements formHelper.IFormValues {
    private special: IFormValue[] = [];

    public add(value: IFormValue): void {
        this.special.push(value);
    }

    public setData(data: any, serializer: formHelper.IFormSerializer): void {
        for(var i = 0; i < this.special.length; ++i){
            this.special[i].setData(data, serializer);
        }
    }

    public recoverData(data: any, serializer: formHelper.IFormSerializer): void {
        for(var i = 0; i < this.special.length; ++i){
            var item = this.special[i];
            var subData = item.getData(serializer);
            data[item.getName()] = subData;
        }
    }
}

interface IFormValue {
    getName(): string;

    getData(serializer: formHelper.IFormSerializer): any;

    setData(data: any, serializer: formHelper.IFormSerializer);
}

const indexMax = 2147483647;//Sticking with 32 bit;

class InfiniteIndex{
    private num: number = 0;
    private base: string = "";

    public getNext(): string {
        ++this.num;
        if(this.num === indexMax){
            this.base += "b"; //Each time we hit index max we just add a 'b' to the base
            this.num = 0;
        }
        return this.base + this.num;
    }
}

function sharedClearer(i: number) {
    return "";
}

class ArrayEditorRow {
    private pooled: PooledBindings;
    private removed = new event.ActionEventDispatcher<ArrayEditorRow>();
    private root: HTMLElement;

    constructor(private bindings: BindingCollection, schema: JsonSchema, private name: string){
        this.root = this.bindings.rootElement;
        var itemHandle = this.bindings.getHandle("item"); //Also supports adding to a handle named item, otherwise uses the root
        if(itemHandle !== null){
            this.root = itemHandle;
        }
        buildForm('hr.defaultform', schema, this.root, this.name, true);

        bindings.setListener(this);
    }

    public get onRemoved(): event.EventModifier<event.ActionEventListener<ArrayEditorRow>>{
        return this.removed.modifier;
    }

    public remove(evt?: Event): void{
        if(evt){
            evt.preventDefault();
        }
        this.pooled = this.bindings.pool();
        formHelper.populate(this.root, sharedClearer, this.name); //Clear existing data
        this.removed.fire(this);
    }

    public restore(){
        if(this.pooled) {
            this.pooled.restore(null);
        }
    }

    public getData(serializer: formHelper.IFormSerializer): any {
        return serializer.serialize(this.name);
    }

    public setData(data: any, serializer: formHelper.IFormSerializer) {
        serializer.populate(data, this.name);
    }
}

class ArrayEditor implements IFormValue {
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
        this.addRow();
    }

    private addRow(): void{
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

    public getData(serializer: formHelper.IFormSerializer): any {
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

    public setData(data: any, serializer: formHelper.IFormSerializer) {
        var itemData: any[] = data[this.name];
        var i = 0;
        if(itemData) {
            for(; i < itemData.length; ++i){
                if(i >= this.rows.length){
                    this.addRow();
                }
                var rowData = itemData[i];
                if(this.isSimple){
                    rowData = {
                        "": rowData
                    }
                }
                this.rows[i].setData(rowData, serializer);
            }
        }
        for(; i < this.rows.length;){ //Does not increment, removing rows will de index for us
            this.rows[i].remove();
        }
    }

    public getName(): string{
        return this.name;
    }
}

class BasicItemEditor implements IFormValue{
    private toggle: toggle.OnOffToggle;
    private message: view.IView<string>;

    constructor(private name: string, bindings: BindingCollection){
        this.toggle = bindings.getToggle(name + "Error");
        this.toggle.on();
        this.message = bindings.getView(name + "ErrorMessage");
        this.message.setData("Hello, this is an error message");
    }

    public getData(serializer: formHelper.IFormSerializer): any {
        //Does nothing, relies on the normal form serializer function
    }

    public setData(data: any, serializer: formHelper.IFormSerializer) {
        //Does nothing, relies on the normal form serializer function
    }

    public getName(): string{
        return this.name;
    }
}

function buildForm(componentName: string, schema: JsonSchema, parentElement: HTMLElement, baseName?: string, ignoreExisting?: boolean): FormValues {
    var formValues = new FormValues();

    if(ignoreExisting === undefined){
        ignoreExisting = false;
    }

    if(baseName === undefined){
        baseName = "";
    }
    
    var dynamicInsertElement = domquery.first("[data-hr-form-end]", parentElement);
    if(dynamicInsertElement !== null){
        //Adjust parent to end element if one was found
        parentElement = dynamicInsertElement.parentElement;
    }
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
        var existing = <HTMLElement>domquery.first('[name=' + item.buildName + ']', parentElement);
        var bindings: BindingCollection = null;
        if(ignoreExisting || existing === null){
            //Create component if it is null
            bindings = component.one(componentName, item, parentElement, dynamicInsertElement, undefined, (i) => {
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
        }
        else{
            //Existing element, try to create a binding collection for it
            //Walk up element parents trying to find one with a data-hr-form-start attribute on it.
            var bindParent = existing;
            while(bindings === null && bindParent !== null && bindParent !== parentElement){
                if(bindParent.hasAttribute("data-hr-form-start")){
                    bindings = new BindingCollection(bindParent);
                }
                else{
                    bindParent = bindParent.parentElement;
                }
            }
        }

        if(bindings !== null){
            if(item.buildType === "arrayEditor"){
                var resolvedItems = resolveRef(<RefNode>item.items, schema);
                var editor = new ArrayEditor(item.buildName, bindings, resolvedItems);
                formValues.add(editor);
            }
            else{
                formValues.add(new BasicItemEditor(item.buildName, bindings));
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

    return formValues;
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
    else {
        if(prop["x-ui-type"] !== undefined) {
            processed.buildType = prop["x-ui-type"];
        }
        else {
            if(processed.buildValues !== undefined) {
                //Has build options, force to select unless the user chose something else.
                processed.buildType = "select";
            }
            else {
                //Regular type, no options, derive html type
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

        //Post process elements that might have more special properties
        //Do this here, since we don't really know how we got to this build type
        switch(processed.buildType){
            case 'checkbox':
                processed.buildValue = "true";
                if(prop["x-value"] !== undefined){
                    processed.buildValue = prop["x-value"];
                }
                break;
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

//Register form build function
formHelper.setBuildFormFunc(buildForm);