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
import { FormErrors } from 'hr.error';
import * as typeIds from 'hr.typeidentifiers';

interface ProcessedJsonProperty extends JsonProperty {
    name: string;
    buildName: string;
    buildType: string;
    buildOrder: number;
    buildValues?: JsonLabel[]; //The values if there are multiple value choices, e.g. combo boxes
    size?: number;
    buildValue?: string; //The value if there is a single value for this item, e.g. checkboxes
}

class FormValues implements formHelper.IFormValues {
    private values: IFormValue[] = [];

    public add(value: IFormValue): void {
        this.values.push(value);
    }

    public setError(err: FormErrors, baseName?: string) {
        if(baseName === undefined){
            baseName = "";
        }
        for(var i = 0; i < this.values.length; ++i){
            this.values[i].setError(err, baseName);
        }
    }

    public setData(data: any, serializer: formHelper.IFormSerializer): void {
        for(var i = 0; i < this.values.length; ++i){
            this.values[i].setData(data, serializer);
        }
    }

    public recoverData(data: any, serializer: formHelper.IFormSerializer): void {
        for(var i = 0; i < this.values.length; ++i){
            var item = this.values[i];
            var subData = item.getData(serializer);
            if (subData !== undefined) {
                data[item.getName()] = subData;
            }
        }
    }

    public changeSchema(componentName: string, schema: JsonSchema, parentElement: HTMLElement): void{
        var keep = [];
        for(var i = 0; i < this.values.length; ++i){
            if(!this.values[i].delete()){
                keep.push(this.values[i]);
            }
        }
        this.values = keep; //Replace the values with just what we kept
        buildForm(componentName, schema, parentElement, undefined, undefined, this); //Rebuild the form
    }

    public hasFormValue(buildName: string): boolean{
        for(var i = 0; i < this.values.length; ++i){
            if(this.values[i].getName() === buildName){
                return true;
            }
        }
        return false;
    }
}

export interface IFormValue {
    setError(err: FormErrors, baseName: string);

    getName(): string;

    getData(serializer: formHelper.IFormSerializer): any;

    setData(data: any, serializer: formHelper.IFormSerializer);

    /**
     * Delete the form value, this might not actually happen. Return true if the item was deleted
     * and false if it was kept. If you return false the item will be added to a pool. This is done
     * for items the user manually put on the form.
     */
    delete(): boolean;
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
    private formValues: FormValues;

    constructor(private bindings: BindingCollection, schema: JsonSchema, private name: string){
        this.root = this.bindings.rootElement;
        var itemHandle = this.bindings.getHandle("item"); //Also supports adding to a handle named item, otherwise uses the root
        if(itemHandle !== null){
            this.root = itemHandle;
        }
        this.formValues = buildForm('hr.forms.default', schema, this.root, this.name, true);

        bindings.setListener(this);
    }

    public get onRemoved(): event.EventModifier<event.ActionEventListener<ArrayEditorRow>>{
        return this.removed.modifier;
    }

    public remove(evt?: Event): void{
        if(evt){
            evt.preventDefault();
        }
        this.setError(formHelper.getSharedClearingValidator(), "");
        this.pooled = this.bindings.pool();
        formHelper.populate(this.root, sharedClearer, this.name); //Clear existing data
        this.removed.fire(this);
    }

    public restore(){
        if(this.pooled) {
            this.pooled.restore(null);
        }
    }

    public setError(err: FormErrors, baseName: string) {
        this.formValues.setError(err, baseName);
    }

    public getData(serializer: formHelper.IFormSerializer): any {
        var data = serializer.serialize(this.name);
        this.formValues.recoverData(data, serializer);
        if(typeIds.isObject(data)){
            for(var key in data){ //This will pass if there is a key in data
                return data;
            }
            return null; //Return null if the data returned has no keys in it, which means it is empty.
        }

        return data; //Not an object, just return the data
    }

    public setData(data: any, serializer: formHelper.IFormSerializer) {
        serializer.populate(data, this.name);
        this.formValues.setData(data, serializer);
        this.setError(formHelper.getSharedClearingValidator(), "");
    }
}

class ArrayEditor implements IFormValue {
    private itemsView: view.IView<JsonSchema>;
    private pooledRows: ArrayEditorRow[] = [];
    private rows: ArrayEditorRow[] = [];
    private indexGen: InfiniteIndex = new InfiniteIndex();
    private isSimple: boolean;

    private errorToggle: toggle.OnOffToggle;
    private errorMessage: view.IView<string>;

    constructor(private name: string, private buildName: string, private bindings: BindingCollection, private schema: JsonSchema, private generated: boolean){
        this.itemsView = bindings.getView<JsonSchema>("items");
        bindings.setListener(this);
        this.isSimple = schema.type !== "object";

        this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
        this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
    }

    public setError(err: FormErrors, baseName: string) {
        for(var i = 0; i < this.rows.length; ++i){
            var rowName = err.addIndex(baseName, this.name, i);
            this.rows[i].setError(err, rowName);
        }

        var errorName = err.addKey(baseName, this.name);
        if(err.hasValidationError(errorName)){
            this.errorToggle.on();
            this.errorMessage.setData(err.getValidationError(errorName));
        }
        else {
            this.errorToggle.off();
            this.errorMessage.setData("");
        }
    }

    public add(evt: Event): void {
        evt.preventDefault();
        this.addRow();
    }

    private addRow(): void{
        if(this.pooledRows.length == 0){
            this.itemsView.appendData(this.schema, (bindings, data) => {
                var row = new ArrayEditorRow(bindings, data, this.buildName + '-' + this.indexGen.getNext());
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
            if(this.isSimple && data !== null){
                data = data[""];
            }
            items.push(data);
        }
        if(items.length > 0){
            return items;
        }
        return undefined;
    }

    public setData(data: any, serializer: formHelper.IFormSerializer) {
        var itemData: any[];
        switch(formHelper.getDataType(data)){
            case formHelper.DataType.Object:
                itemData = data[this.buildName];
                break;
            case formHelper.DataType.Function:
                itemData = data(this.buildName);
                break;
        }

        var i = 0;
        if(itemData) {
            //Make sure data is an array
            if(!typeIds.isArray(itemData)){
                itemData = [itemData];
            }

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
        return this.buildName;
    }

    public delete(): boolean{
        if(this.generated){
            this.bindings.remove();
        }
        return this.generated;
    }
}

export class BasicItemEditor implements IFormValue{
    private errorToggle: toggle.OnOffToggle;
    private errorMessage: view.IView<string>;
    protected name: string;
    protected buildName: string;
    protected bindings: BindingCollection;
    protected generated: boolean;
    protected element: HTMLElement;

    constructor(args: IFormValueBuilderArgs){
        this.name = args.item.name;
        this.buildName = args.item.buildName;
        this.bindings = args.bindings;
        this.generated = args.generated;
        this.element = args.inputElement;

        if(args.item["x-ui-disabled"] === true || args.item.readOnly === true) {
            this.element.setAttribute("disabled", "");
        }

        this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
        this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
    }

    public setError(err: FormErrors, baseName: string) {
        var errorName = err.addKey(baseName, this.name);
        if(err.hasValidationError(errorName)){
            this.errorToggle.on();
            this.errorMessage.setData(err.getValidationError(errorName));
        }
        else {
            this.errorToggle.off();
            this.errorMessage.setData("");
        }
    }

    public getData(serializer: formHelper.IFormSerializer): any {
        //Does nothing, relies on the normal form serializer function
    }

    public setData(data: any, serializer: formHelper.IFormSerializer) {
        //Does nothing, relies on the normal form serializer function
        this.setError(formHelper.getSharedClearingValidator(), "");
    }

    public getName(): string{
        return this.buildName;
    }

    public delete(): boolean{
        if(this.generated){
            this.bindings.remove();
        }
        return this.generated;
    }
}

export class IFormValueBuilderArgs {
    item: ProcessedJsonProperty;
    bindings: BindingCollection;
    generated: boolean;
    schema: JsonSchema;
    inputElement: HTMLElement;
}

export interface IFormValueBuilder {
    create(args: IFormValueBuilderArgs) : IFormValue | null;
}

function buildForm(componentName: string, schema: JsonSchema, parentElement: HTMLElement, baseName?: string, ignoreExisting?: boolean, formValues?: FormValues): FormValues {
    if(ignoreExisting === undefined){
        ignoreExisting = false;
    }

    if(baseName === undefined){
        baseName = "";
    }

    if(formValues === undefined){
        formValues = new FormValues();
    }
    
    var insertParent = parentElement;
    var dynamicInsertElement = domquery.first("[data-hr-form-end]", parentElement);
    if(dynamicInsertElement !== null){
        //Adjust parent to end element if one was found
        insertParent = dynamicInsertElement.parentElement;
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
            propArray.push(processProperty(props[key], key, baseNameWithSep + key));
        }

        propArray.sort((a, b) =>{
            return a.buildOrder - b.buildOrder;
        });
    }

    for(var i = 0; i < propArray.length; ++i){
        var item = propArray[i];
        var existing = <HTMLElement>domquery.first('[name=' + item.buildName + ']', parentElement);
        var bindings: BindingCollection = null;
        var generated = false;
        if(ignoreExisting || existing === null){
            //Create component if it is null
            bindings = component.one(componentName, item, insertParent, dynamicInsertElement, undefined, (i) => {
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

            generated = true;
        }
        else{
            //If this was an exising element, see if we should reuse what was found before, if the formValues already has an item, do nothing here
            if(!formValues.hasFormValue(item.buildName)){
                //Not found, try to create a binding collection for it
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

                generated = false;
            }
        }

        if (bindings !== null) {
            formValues.add(createBindings({
                bindings: bindings,
                generated: generated,
                item: item,
                schema: schema,
                inputElement: existing
            }));
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
                    if(current.value !== null && current.value !== undefined){
                        option.value = current.value;
                    }
                    option.text = current.label;
                    existing.options.add(option);
                }
            }
        }
    }

    return formValues;
}

function createBindings(args: IFormValueBuilderArgs) : IFormValue {
    //See if there is a custom handler first
    for(var i = 0; i < formValueBuilders.length; ++i){
        var created = formValueBuilders[i].create(args);
        if(created !== null){
            return created;
        }
    }

    if (args.item.buildType === "arrayEditor") {
        var resolvedItems = resolveRef(<RefNode>args.item.items, args.schema);
        return new ArrayEditor(args.item.name, args.item.buildName, args.bindings, resolvedItems, args.generated);
    }
    else {
        return new BasicItemEditor(args);
    }
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

function processProperty(prop: JsonProperty, name: string, buildName: string): ProcessedJsonProperty{
    var processed : ProcessedJsonProperty = Object.create(prop);
    processed.buildName = buildName;
    processed.name = name;
    if(processed.title === undefined){ //Set title if it is not set
        processed.title = name;
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
                switch(processed.buildType) {
                    case 'integer':
                        processed.buildType = 'number';
                        break;
                    case 'boolean':
                        processed.buildType = 'checkbox';
                        break;
                    case 'string':
                        switch (processed.format) {
                            case 'date-time':
                                processed.buildType = 'date-time';
                                break;
                            default:
                                processed.buildType = 'text';
                                break;
                        }
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
            case 'textarea':
                if (processed.size === undefined) {
                    processed.size = 5;
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

var formValueBuilders: IFormValueBuilder[] = [];

export function registerFormValueBuilder(builder: IFormValueBuilder) {
    formValueBuilders.push(builder);
}

//Register form build function
formHelper.setBuildFormFunc(buildForm);