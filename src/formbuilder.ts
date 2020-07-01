///<amd-module name="hr.formbuilder"/>

"use strict";

import * as component from 'hr.components';
import * as domquery from 'hr.domquery';
import { BindingCollection, PooledBindings } from 'hr.bindingcollection';
import * as view from 'hr.view';
import * as toggle from 'hr.toggles';
import * as event from 'hr.eventdispatcher';
import * as formHelper from 'hr.formhelper';
import { JsonProperty, JsonLabel, JsonSchema, resolveRef, RefNode, isRefNode, getOneOfSchema } from 'hr.schema';
import { FormErrors } from 'hr.error';
import * as typeIds from 'hr.typeidentifiers';
import * as expression from 'hr.expressiontree';
export { IFormValue, GetParentData } from 'hr.formhelper';
import * as iterable from 'hr.iterable';
import { TimedTrigger } from 'hr.timedtrigger';
import { ITextStreamData } from 'hr.textstream';
import * as schemaprocessor from 'hr.schemaprocessor';

class FormValuesSource implements expression.IValueSource {
    constructor(private formValues: FormValues) {

    }

    getValue(address: expression.IDataAddress): any {
        var value = this.formValues.getFormValue(<string>address.address[0].key); //for now assume strings, this only supports the current level object
        if (value !== undefined) {
            var data = value.getData();
            //Only return the data if it would be included in the form data
            if (formHelper.shouldAddValue(data)) {
                return data;
            }
        }
        return undefined;
    }
}

class FormValues implements formHelper.IFormValues {
    private values: formHelper.IFormValue[] = [];
    private valueSource: FormValuesSource;
    private fireChangesToValues: boolean = false;
    private changedEventHandler: event.ActionEventDispatcher<formHelper.IFormValuesArgs> = new event.ActionEventDispatcher<formHelper.IFormValuesArgs>();
    private complexValues: boolean = true; //If this is true, the values passed in are complex, which means they are functions or objects with multiple values, otherwise they are simple and the values should be used directly.

    constructor() {
        this.valueSource = new FormValuesSource(this);
    }

    public add(value: formHelper.IFormValue): void {
        this.values.push(value);
        if (value.isChangeTrigger) {
            value.onChanged.add(a => this.fireChangedEventHandler(a.getDataName()));
        }
        if (value.respondsToChanges) {
            this.fireChangesToValues = true;
        }
    }

    public setError(err: FormErrors, baseName?: string) {
        if (baseName === undefined) {
            baseName = "";
        }
        for (var i = 0; i < this.values.length; ++i) {
            this.values[i].setError(err, baseName);
        }
    }

    public setData(data: any): void {
        var dataType = formHelper.getDataType(data);
        var parentRecovery: formHelper.GetParentData;

        if (this.complexValues && data !== null) { //If this is complex values, lookup the data, also be sure the data isn't null or we will get an error
            switch (dataType) {
                case formHelper.DataType.Object:
                    parentRecovery = (name: string) => data[name];
                    break;
                case formHelper.DataType.Function:
                    parentRecovery = data;
                    break;
            }
        }
        else { //Simple value or null
            if (dataType !== formHelper.DataType.Function) { //Ignore functions for simple data, otherwise take the data as the value (will also happen for null)
                parentRecovery = (name: string) => data;
            }
            else {
                parentRecovery = (name: string) => null;
            }
        }

        for (var i = 0; i < this.values.length; ++i) { //Go through all items
            var item = this.values[i];
            var itemData: any = parentRecovery(item.getDataName());
            item.setData(itemData, parentRecovery);
        }
    }

    public recoverData(proto: {} | null): any {
        if (this.complexValues) {
            var data = Object.create(proto || null);

            for (var i = 0; i < this.values.length; ++i) {
                var item = this.values[i];
                var value = item.getData();
                if (formHelper.shouldAddValue(value)) { //Do not record undefined, null or empty values
                    data[item.getDataName()] = value;
                }
            }

            return data;
        }
        else {
            //Simple data only supports one return value, so return the first value item
            if (this.values.length > 0) {
                return this.values[0].getData();
            }
            return undefined; //No data to get, return undefined.
        }
    }

    public changeSchema(componentName: string, schema: JsonSchema, parentElement: HTMLElement): void {
        var keep = [];
        for (var i = 0; i < this.values.length; ++i) {
            if (!this.values[i].delete()) {
                keep.push(this.values[i]);
            }
        }
        this.values = keep; //Replace the values with just what we kept
        buildForm(componentName, schema, parentElement, undefined, undefined, this); //Rebuild the form
    }

    public hasFormValue(buildName: string): boolean {
        for (var i = 0; i < this.values.length; ++i) {
            if (this.values[i].getBuildName() === buildName) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get a form value by the generated build name. This will require it to be fully qualified.
     * @param buildName The build name for the form value to lookup
     */
    public getFormValue(buildName: string): formHelper.IFormValue {
        for (var i = 0; i < this.values.length; ++i) {
            if (this.values[i].getBuildName() === buildName) {
                return this.values[i];
            }
        }
        return undefined;
    }

    /**
     * Get a form value by the data name. This will use the name that will be used when the final object is created.
     * @param dataName The build name for the form value to lookup
     */
    public getFormValueByDataName(dataName: string): formHelper.IFormValue {
        for (var i = 0; i < this.values.length; ++i) {
            if (this.values[i].getDataName() === dataName) {
                return this.values[i];
            }
        }
        return undefined;
    }

    public get onChanged() {
        return this.changedEventHandler.modifier;
    }

    public fireDataChanged() {
        this.fireChangedEventHandler(null);
    }

    private fireChangedEventHandler(propName: string) {
        if (this.fireChangesToValues) {
            for (var i = 0; i < this.values.length; ++i) {
                this.values[i].handleChange(this.valueSource);
            }
        }
        this.changedEventHandler.fire({
            formValues: this,
            propertyName: propName
        });
    }

    /**
     * Set this to true to set that the values are complex and should be looked up, otherwise they are simple and
     * should be gotten / set directly.
     * @param complex
     */
    public setComplex(complex: boolean) {
        this.complexValues = complex;
    }
}

const indexMax = 2147483647;//Sticking with 32 bit;

class InfiniteIndex {
    private num: number = 0;
    private base: string = "";

    public getNext(): string {
        ++this.num;
        if (this.num === indexMax) {
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

    constructor(private bindings: BindingCollection, schema: JsonSchema, private name: string) {
        this.root = this.bindings.rootElement;
        var itemHandle = this.bindings.getHandle("item"); //Also supports adding to a handle named item, otherwise uses the root
        if (itemHandle !== null) {
            this.root = itemHandle;
        }
        this.formValues = buildForm('hr.forms.default', schema, this.root, this.name);

        bindings.setListener(this);
    }

    public get onRemoved(): event.EventModifier<event.ActionEventListener<ArrayEditorRow>> {
        return this.removed.modifier;
    }

    public remove(evt?: Event): void {
        if (evt) {
            evt.preventDefault();
        }
        this.setError(formHelper.getSharedClearingValidator(), "");
        this.pooled = this.bindings.pool();
        this.setData(sharedClearer);
        this.removed.fire(this);
    }

    public restore() {
        if (this.pooled) {
            this.pooled.restore(null);
        }
    }

    public setError(err: FormErrors, baseName: string) {
        this.formValues.setError(err, baseName);
    }

    public getData(): any {
        var data = this.formValues.recoverData(null);
        if (typeIds.isObject(data)) {
            for (var key in data) { //This will pass if there is a key in data
                return data;
            }
            return null; //Return null if the data returned has no keys in it, which means it is empty.
        }

        return data; //Not an object, just return the data
    }

    public setData(data: any) {
        this.formValues.setData(data);
        this.setError(formHelper.getSharedClearingValidator(), "");
    }
}

class ArrayEditor implements formHelper.IFormValue {
    private itemsView: view.IView<JsonSchema>;
    private pooledRows: ArrayEditorRow[] = [];
    private rows: ArrayEditorRow[] = [];
    private indexGen: InfiniteIndex = new InfiniteIndex();

    private errorToggle: toggle.OnOffToggle;
    private errorMessage: view.IView<string>;

    private name: string;
    private buildName: string;
    private bindings: BindingCollection;
    private generated: boolean;
    protected displayExpression: expression.ExpressionTree;
    private hideToggle: toggle.OnOffToggle;

    constructor(args: IFormValueBuilderArgs, private schema: JsonSchema) {
        var baseTitle: string = args.item.title;
        var bindings = args.bindings;
        this.name = args.item.name;
        this.buildName = args.item.buildName;
        this.bindings = args.bindings;
        this.generated = args.generated;
        this.displayExpression = args.item.displayExpression;

        this.itemsView = bindings.getView<JsonSchema>("items");
        bindings.setListener(this);

        if (this.schema.title === undefined) {
            this.schema = Object.create(this.schema);
            if (baseTitle !== undefined) {
                this.schema.title = baseTitle + " Item";
            }
            else {
                this.schema.title = "Item";
            }
        }

        this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
        this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
        this.hideToggle = this.bindings.getToggle(this.buildName + "Hide");
    }

    public setError(err: FormErrors, baseName: string) {
        for (var i = 0; i < this.rows.length; ++i) {
            var rowName = err.addIndex(baseName, this.name, i);
            this.rows[i].setError(err, rowName);
        }

        var errorName = err.addKey(baseName, this.name);
        if (err.hasValidationError(errorName)) {
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

    private addRow(): void {
        if (this.pooledRows.length == 0) {
            this.itemsView.appendData(this.schema, (bindings, data) => {
                var row = new ArrayEditorRow(bindings, data, this.buildName + '-' + this.indexGen.getNext());
                row.onRemoved.add((r) => {
                    this.rows.splice(this.rows.indexOf(r), 1); //It will always be there
                    this.pooledRows.push(r);
                });
                this.rows.push(row);
            });
        }
        else {
            var row = this.pooledRows.pop();
            row.restore();
            this.rows.push(row);
        }
    }

    public getData(): any {
        var items = [];
        for (var i = 0; i < this.rows.length; ++i) {
            items.push(this.rows[i].getData());
        }
        if (items.length > 0) {
            return items;
        }
        return undefined;
    }

    public setData(data: any[]) {
        var i = 0;
        if (data) {
            //Make sure data is an array
            if (!typeIds.isArray(data)) {
                data = [data];
            }

            for (; i < data.length; ++i) {
                if (i >= this.rows.length) {
                    this.addRow();
                }
                this.rows[i].setData(data[i]);
            }
        }
        for (; i < this.rows.length;) { //Does not increment, removing rows will de index for us
            this.rows[i].remove();
        }
    }

    public getBuildName(): string {
        return this.buildName;
    }

    public getDataName(): string {
        return this.name;
    }

    public delete(): boolean {
        if (this.generated) {
            this.bindings.remove();
        }
        return this.generated;
    }

    public get isChangeTrigger(): boolean {
        return false;
    }

    public get onChanged() {
        return null;
    }

    public get respondsToChanges() {
        return this.displayExpression !== undefined;
    }

    public handleChange(values: expression.IValueSource): void {
        if (this.displayExpression) {
            if (this.displayExpression.isTrue(values)) {
                this.hideToggle.off();
            }
            else {
                this.hideToggle.on();
            }
        }
    }
}

class ObjectEditor implements formHelper.IFormValue {
    private itemsView: view.IView<JsonSchema>;

    private errorToggle: toggle.OnOffToggle;
    private errorMessage: view.IView<string>;

    private row: ArrayEditorRow;
    private name: string;
    private buildName: string;
    private bindings: BindingCollection;
    private generated: boolean;
    protected displayExpression: expression.ExpressionTree;
    private hideToggle: toggle.OnOffToggle;

    constructor(args: IFormValueBuilderArgs, private schema: JsonSchema) {
        var baseTitle: string = args.item.title;
        var bindings = args.bindings;
        this.name = args.item.name;
        this.buildName = args.item.buildName;
        this.bindings = args.bindings;
        this.generated = args.generated;
        this.displayExpression = args.item.displayExpression;

        this.itemsView = bindings.getView<JsonSchema>("items");
        bindings.setListener(this);

        if (this.schema.title === undefined) {
            this.schema = Object.create(this.schema);
            if (baseTitle !== undefined) {
                this.schema.title = baseTitle + " Item";
            }
            else {
                this.schema.title = "Item";
            }
        }

        this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
        this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
        this.hideToggle = this.bindings.getToggle(this.buildName + "Hide");

        this.itemsView.appendData(this.schema, (bindings, data) => {
            this.row = new ArrayEditorRow(bindings, data, this.buildName + '-0');
        });
    }

    public setError(err: FormErrors, baseName: string) {
        var rowName = err.addKey(baseName, this.name);
        this.row.setError(err, rowName);

        var errorName = err.addKey(baseName, this.name);
        if (err.hasValidationError(errorName)) {
            this.errorToggle.on();
            this.errorMessage.setData(err.getValidationError(errorName));
        }
        else {
            this.errorToggle.off();
            this.errorMessage.setData("");
        }
    }

    public getData(): any {
        return this.row.getData();
    }

    public setData(data: any) {
        if (data === undefined) {
            data = null;
        }
        this.row.setData(data);
    }

    public getBuildName(): string {
        return this.buildName;
    }

    public getDataName(): string {
        return this.name;
    }

    public delete(): boolean {
        if (this.generated) {
            this.bindings.remove();
        }
        return this.generated;
    }

    public get isChangeTrigger(): boolean {
        return false;
    }

    public get onChanged() {
        return null;
    }

    public get respondsToChanges() {
        return this.displayExpression !== undefined;
    }

    public handleChange(values: expression.IValueSource): void {
        if (this.displayExpression) {
            if (this.displayExpression.isTrue(values)) {
                this.hideToggle.off();
            }
            else {
                this.hideToggle.on();
            }
        }
    }
}

export class BasicItemEditor implements formHelper.IFormValueWithOptions {
    private errorToggle: toggle.OnOffToggle;
    private errorMessage: view.IView<string>;
    private hideToggle: toggle.OnOffToggle;
    private changedEventHandler: event.ActionEventDispatcher<formHelper.IFormValue> = null;
    protected name: string;
    protected buildName: string;
    protected bindings: BindingCollection;
    protected generated: boolean;
    protected element: HTMLElement;
    protected displayExpression: expression.ExpressionTree;
    protected datalistValues?: JsonLabel[];

    constructor(args: IFormValueBuilderArgs) {
        this.name = args.item.name;
        this.buildName = args.item.buildName;
        this.bindings = args.bindings;
        this.generated = args.generated;
        this.element = args.inputElement;
        this.displayExpression = args.item.displayExpression;

        if (args.item["x-ui-disabled"] === true || args.item.readOnly === true || args.item["x-readOnly"] === true) {
            this.element.setAttribute("disabled", "");
        }

        var self = this;
        this.changedEventHandler = new event.ActionEventDispatcher<formHelper.IFormValue>();
        this.element.addEventListener("change", e => {
            self.changedEventHandler.fire(self);
        });

        this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
        this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
        this.hideToggle = this.bindings.getToggle(this.buildName + "Hide");

        //If there are values defined for the element, put them on the page, this works for both
        //predefined and generated elements, which allows you to have predefined selects that can have dynamic values
        if (args.item.buildValues !== undefined) {
            if (IsSelectElement(args.inputElement) || HasDatalist(args.inputElement)) {
                for (var q = 0; q < args.item.buildValues.length; ++q) {
                    var current = args.item.buildValues[q];
                    this.addOption(current.label, current.value);
                }
            }
            if (HasDatalist(args.inputElement)) {
                this.datalistValues = args.item.buildValues;
            }
        }
    }

    public addOption(label: string, value: any) {
        if (IsSelectElement(this.element)) {
            var option = document.createElement("option");
            option.text = label;
            if (value !== null && value !== undefined) {
                option.value = value;
            }
            else {
                option.value = ""; //Make sure this stays as empty string, which will be null for these forms
            }

            this.element.options.add(option);
        }
        else if (HasDatalist(this.element)) {
            //Dataset options are different, we just handle the option value
            var option = document.createElement("option");
            option.value = label;
            this.element.list.appendChild(option);
        }
    }

    public setError(err: FormErrors, baseName: string) {
        var errorName = err.addKey(baseName, this.name);
        if (err.hasValidationError(errorName)) {
            this.errorToggle.on();
            this.errorMessage.setData(err.getValidationError(errorName));
        }
        else {
            this.errorToggle.off();
            this.errorMessage.setData("");
        }
    }

    public getData(): any {
        var value = formHelper.readValue(this.element);
        if (this.datalistValues !== undefined) {
            //Reverse lookup value from the datalist values
            for (var q = 0; q < this.datalistValues.length; ++q) {
                var current = this.datalistValues[q];
                if (current.label == value) {
                    value = current.value;
                    break;
                }
            }
        }
        return value;
    }

    public setData(data: any) {
        if (this.datalistValues !== undefined) {
            //See if there is a datalist value to display instead
            for (var q = 0; q < this.datalistValues.length; ++q) {
                var current = this.datalistValues[q];
                if (current.value == data) {
                    data = current.label;
                    break;
                }
            }
        }

        this.doSetValue(data);
        this.setError(formHelper.getSharedClearingValidator(), "");
    }

    /**
     * This function actually sets the value for the element, if you are creating a subclass for BasicItemEditor
     * you should override this function to actually set the value instead of overriding setData,
     * this way the other logic for setting data (getting the actual data, clearing errors, computing defaults) can
     * still happen. There is no need to call super.doSetData as that will only set the data on the form
     * using the formHelper.setValue function.
     * @param itemData The data to set for the item, this is the final value that should be set, no lookup needed.
     */
    protected doSetValue(itemData: any) {
        formHelper.setValue(<any>this.element, itemData);
    }

    public getBuildName(): string {
        return this.buildName;
    }

    public getDataName(): string {
        return this.name;
    }

    public delete(): boolean {
        if (this.generated) {
            this.bindings.remove();
        }
        return this.generated;
    }

    public get isChangeTrigger(): boolean {
        return this.changedEventHandler !== null;
    }

    public get onChanged() {
        if (this.changedEventHandler !== null) {
            return this.changedEventHandler.modifier;
        }
        return null;
    }

    public get respondsToChanges() {
        return this.displayExpression !== undefined;
    }

    public handleChange(values: expression.IValueSource): void {
        if (this.displayExpression) {
            if (this.displayExpression.isTrue(values)) {
                this.hideToggle.off();
            }
            else {
                this.hideToggle.on();
            }
        }
    }
}

export interface SearchResult {
    title: string;
    value: any;
}

export class SearchResultRow {
    constructor(private searchEditor: SearchItemEditor, bindings: BindingCollection, private data: SearchResult) {
        bindings.setListener(this);
    }

    public selectItem(evt: Event): void {
        evt.preventDefault();
        this.searchEditor.setDataFromSearchResult(this.data);
    }
}

export interface ISearchArgs {
    searchTerm: string;
    getFormValue(name: string): any;
}

export interface ISearchResultProvider {
    search(args: ISearchArgs): Promise<iterable.IterableInterface<SearchResult>>;
}

export type SearchResultProviderFactoryCb = () => ISearchResultProvider;

class SearchResultProviderFactory {
    private factories: { [key: string]: SearchResultProviderFactoryCb } = {};

    public addFactory(name: string, factory: SearchResultProviderFactoryCb) {
        this.factories[name] = factory;
    }

    public create(name: string): ISearchResultProvider {
        var factory = this.factories[name];
        if (factory === undefined) {
            throw new Error("A Search Provider Factory named " + name + " cannot be found. Did you forget to register it?");
        }
        return factory();
    }
}

export var SearchResultProvider = new SearchResultProviderFactory();

export class SearchItemEditor implements formHelper.IFormValueWithOptions {
    private errorToggle: toggle.OnOffToggle;
    private errorMessage: view.IView<string>;
    private hideToggle: toggle.OnOffToggle;
    private changedEventHandler: event.ActionEventDispatcher<formHelper.IFormValue> = null;
    private popupToggle: toggle.OnOffToggle;
    private resultsView: view.IView<SearchResult>;
    private searchResultProvider: ISearchResultProvider;
    private searchFocusParent: HTMLElement;
    private typingTrigger = new TimedTrigger<SearchItemEditor>(400);
    private lastSearchTerm: string;
    private formValues: FormValues;
    protected name: string;
    protected buildName: string;
    protected bindings: BindingCollection;
    protected generated: boolean;
    protected element: HTMLElement;
    protected displayExpression: expression.ExpressionTree;
    protected currentValueProperty: string;
    protected currentData: any;
    protected currentDisplay: any;

    constructor(args: IFormValueBuilderArgs) {
        this.name = args.item.name;
        this.buildName = args.item.buildName;
        this.bindings = args.bindings;
        this.generated = args.generated;
        this.element = args.inputElement;
        this.displayExpression = args.item.displayExpression;
        this.popupToggle = this.bindings.getToggle("popup");
        this.resultsView = this.bindings.getView("results");
        this.searchFocusParent = this.bindings.getHandle("searchFocusParent");
        this.typingTrigger.addListener(arg => this.runSearch(arg));
        this.searchResultProvider = args.searchResultProviderFactory.create(args.item["x-search"].provider);
        this.formValues = args.formValues;

        if (args.item["x-ui-disabled"] === true || args.item.readOnly === true) {
            this.element.setAttribute("disabled", "");
        }

        this.currentValueProperty = args.item["x-search"].valueProperty;

        var self = this;
        this.changedEventHandler = new event.ActionEventDispatcher<formHelper.IFormValue>();
        this.bindings.setListener(this);

        this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
        this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
        this.hideToggle = this.bindings.getToggle(this.buildName + "Hide");

        //If there are values defined for the element, put them on the page, this works for both
        //predefined and generated elements, which allows you to have predefined selects that can have dynamic values
        if (args.item.buildValues !== undefined) {
            if (IsSelectElement(args.inputElement)) {
                for (var q = 0; q < args.item.buildValues.length; ++q) {
                    var current = args.item.buildValues[q];
                    this.addOption(current.label, current.value);
                }
            }
        }
    }

    public addOption(label: string, value: any) {
        if (IsSelectElement(this.element)) {
            var option = document.createElement("option");
            option.text = label;
            if (value !== null && value !== undefined) {
                option.value = value;
            }
            else {
                option.value = ""; //Make sure this stays as empty string, which will be null for these forms
            }
            this.element.options.add(option);
        }
    }

    public setError(err: FormErrors, baseName: string) {
        var errorName = err.addKey(baseName, this.name);
        if (err.hasValidationError(errorName)) {
            this.errorToggle.on();
            this.errorMessage.setData(err.getValidationError(errorName));
        }
        else {
            this.errorToggle.off();
            this.errorMessage.setData("");
        }
    }

    public getData(): any {
        return this.currentData;
    }

    public setData(data: any, parentDataAccess?: formHelper.GetParentData) {
        this.currentData = data;
        if (this.currentValueProperty) {
            data = parentDataAccess(this.currentValueProperty);
        }
        this.currentDisplay = data;
        formHelper.setValue(<any>this.element, data);
        this.setError(formHelper.getSharedClearingValidator(), "");
    }

    public getBuildName(): string {
        return this.buildName;
    }

    public getDataName(): string {
        return this.name;
    }

    public delete(): boolean {
        if (this.generated) {
            this.bindings.remove();
        }
        return this.generated;
    }

    public get isChangeTrigger(): boolean {
        return this.changedEventHandler !== null;
    }

    public get onChanged() {
        if (this.changedEventHandler !== null) {
            return this.changedEventHandler.modifier;
        }
        return null;
    }

    public get respondsToChanges() {
        return this.displayExpression !== undefined;
    }

    public handleChange(values: expression.IValueSource): void {
        if (this.displayExpression) {
            if (this.displayExpression.isTrue(values)) {
                this.hideToggle.off();
            }
            else {
                this.hideToggle.on();
            }
        }
    }

    public stopSearch(evt: FocusEvent): void {
        evt.preventDefault();
        if (!this.searchFocusParent.contains(<HTMLElement>evt.relatedTarget)) {
            this.typingTrigger.cancel();
            //If the current value is null, undefined or empty clear the input.
            if ((<any>this.element).value === "" || (<any>this.element).value === null || (<any>this.element).value === undefined) {
                this.currentDisplay = "";
                this.currentData = null;
            }
            formHelper.setValue(<any>this.element, this.currentDisplay);
            this.popupToggle.off();
        }
    }

    private updateSearch(evt: Event): void {
        evt.preventDefault();
        this.typingTrigger.fire(this);
    }

    public setDataFromSearchResult(result: SearchResult): void {
        formHelper.setValue(<any>this.element, result.title);
        this.currentData = result.value;
        this.currentDisplay = result.title;
        this.popupToggle.off();
        this.changedEventHandler.fire(this);
    }

    private async runSearch(arg: SearchItemEditor): Promise<void> {
        try {
            this.resultsView.setData({
                title: "Loading...",
                value: null
            }, null, () => "message");
            this.popupToggle.on();
            var searchTerm = formHelper.readValue(this.element);
            this.lastSearchTerm = searchTerm;
            var self = this;
            var results = await this.searchResultProvider.search({
                searchTerm: searchTerm,
                getFormValue: (name: string) => {
                    var formValue = self.formValues.getFormValueByDataName(name);
                    if (formValue) {
                        return formValue.getData()
                    }
                    return undefined;
                }
            });
            if (this.lastSearchTerm === searchTerm) {
                this.resultsView.setData(results, (element, data) => new SearchResultRow(this, new BindingCollection(element.elements), data));
            }
        }
        catch (err) {
            this.resultsView.setData({
                title: "An error occured searching for data. Please try again later.",
                value: null
            }, null, () => "message");
            console.log(err.message || err);
        }
    }
}

export class MultiCheckBoxEditor implements formHelper.IFormValueWithOptions {
    private itemsView: view.IView<JsonLabel>;
    private errorToggle: toggle.OnOffToggle;
    private errorMessage: view.IView<string>;
    private hideToggle: toggle.OnOffToggle;
    private changedEventHandler: event.ActionEventDispatcher<formHelper.IFormValue> = null;
    protected name: string;
    protected buildName: string;
    protected bindings: BindingCollection;
    protected generated: boolean;
    protected displayExpression: expression.ExpressionTree;
    protected checkboxElements: HTMLInputElement[] = [];
    protected nullCheckboxElement: HTMLInputElement = null;
    protected selectAllElement: HTMLInputElement = null;
    private disabled: boolean;

    constructor(args: IFormValueBuilderArgs) {
        this.itemsView = args.bindings.getView<any>("items");
        this.name = args.item.name;
        this.buildName = args.item.buildName;
        this.bindings = args.bindings;
        this.bindings.setListener(this);
        this.generated = args.generated;
        this.displayExpression = args.item.displayExpression;
        this.disabled = args.item["x-ui-disabled"] === true || args.item.readOnly === true;
        this.changedEventHandler = new event.ActionEventDispatcher<formHelper.IFormValue>();

        if (args.item.buildValues !== undefined) {
            var uidCount = 0;
            var iter = new iterable.Iterable<JsonLabel>(args.item.buildValues).select<JsonLabel>(i => {
                var r = Object.create(i);
                r.uniqueId = args.item.uniqueId + "-hr-item-id-" + uidCount++;
                return r;
            });
            this.itemsView.setData(iter, (created, item) => this.checkElementCreated(created, item));
        }

        this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
        this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
        this.hideToggle = this.bindings.getToggle(this.buildName + "Hide");

        this.selectAllElement = <HTMLInputElement>this.bindings.getHandle("selectAll");
    }

    public setError(err: FormErrors, baseName: string) {
        var errorName = err.addKey(baseName, this.name);
        if (err.hasValidationError(errorName)) {
            this.errorToggle.on();
            this.errorMessage.setData(err.getValidationError(errorName));
        }
        else {
            this.errorToggle.off();
            this.errorMessage.setData("");
        }
    }

    public getData(): any {
        var results = [];
        var dataOnlyNull = true; //If we only read null data values, return null instead of array with null in it
        for (var i = 0; i < this.checkboxElements.length; ++i) {
            var check = this.checkboxElements[i];
            var data = formHelper.readValue(check);
            if (data !== undefined) {
                results.push(data);
                dataOnlyNull = dataOnlyNull && data === null;
            }
        }
        if (results.length > 0) {
            if (dataOnlyNull) {
                return null;
            }
            return results;
        }
        return undefined;
    }

    public setData(data: any) {
        this.doSetValue(data);
        this.setError(formHelper.getSharedClearingValidator(), "");
    }

    /**
     * This function actually sets the value for the element, if you are creating a subclass for BasicItemEditor
     * you should override this function to actually set the value instead of overriding setData,
     * this way the other logic for setting data (getting the actual data, clearing errors, computing defaults) can
     * still happen. There is no need to call super.doSetData as that will only set the data on the form
     * using the formHelper.setValue function.
     * @param itemData The data to set for the item, this is the final value that should be set, no lookup needed.
     */
    protected doSetValue(itemData: any[]) {
        if (itemData !== null && itemData !== undefined && itemData.length > 0) {
            for (var i = 0; i < this.checkboxElements.length; ++i) {
                var check = this.checkboxElements[i];
                formHelper.setValue(<any>check, looseIndexOf(itemData, (<any>check).value) !== -1);
            }
            if (this.nullCheckboxElement !== null) {
                formHelper.setValue(<any>this.nullCheckboxElement, false);
            }
        }
        else {
            this.clearChecks();
            if (this.nullCheckboxElement !== null) {
                formHelper.setValue(<any>this.nullCheckboxElement, true);
            }
        }

        //Always clear select all
        if (this.selectAllElement !== null) {
            formHelper.setValue(<any>this.selectAllElement, false);
        }
    }

    public addOption(label: string, value: any) {
        this.itemsView.appendData({label: label, value: value}, (created, item) => this.checkElementCreated(created, item));
    }

    public getBuildName(): string {
        return this.buildName;
    }

    public getDataName(): string {
        return this.name;
    }

    public delete(): boolean {
        if (this.generated) {
            this.bindings.remove();
        }
        return this.generated;
    }

    public get isChangeTrigger(): boolean {
        return this.changedEventHandler !== null;
    }

    public get onChanged() {
        if (this.changedEventHandler !== null) {
            return this.changedEventHandler.modifier;
        }
        return null;
    }

    public get respondsToChanges() {
        return this.displayExpression !== undefined;
    }

    public handleChange(values: expression.IValueSource): void {
        if (this.displayExpression) {
            if (this.displayExpression.isTrue(values)) {
                this.hideToggle.off();
            }
            else {
                this.hideToggle.on();
            }
        }
    }

    public selectAll(evt: Event) {
        for (var i = 0; i < this.checkboxElements.length; ++i) {
            var check = this.checkboxElements[i];
            formHelper.setValue(<any>check, true);
        }
        if (this.nullCheckboxElement !== null) {
            formHelper.setValue(<any>this.nullCheckboxElement, false);
        }
    }

    private clearChecks(): void {
        for (var i = 0; i < this.checkboxElements.length; ++i) {
            var check = this.checkboxElements[i];
            formHelper.setValue(<any>check, false);
        }
    }

    private checkElementCreated(created, item): void {
        var element = created.getHandle("check");
        if (item.value !== null) {
            this.checkboxElements.push(element);
            element.addEventListener("change", e => {
                if (this.nullCheckboxElement !== null) {
                    formHelper.setValue(<any>this.nullCheckboxElement, false);
                }
                if (this.selectAllElement !== null) {
                    formHelper.setValue(<any>this.selectAllElement, false);
                }
                this.changedEventHandler.fire(this);
            });
        }
        else {
            this.nullCheckboxElement = element;
            element.addEventListener("change", e => {
                this.doSetValue(null); //Clear values
                this.changedEventHandler.fire(this);
            });
        }
        if (this.disabled) {
            element.setAttribute("disabled", "");
        }
    }
}

function looseIndexOf(array: any[], find: any) {
    for (var i = 0; i < array.length; ++i) {
        if (array[i] == find) {
            return i;
        }
    }
    return -1;
}

export class RadioButtonEditor implements formHelper.IFormValueWithOptions {
    private itemsView: view.IView<JsonLabel>;
    private errorToggle: toggle.OnOffToggle;
    private errorMessage: view.IView<string>;
    private hideToggle: toggle.OnOffToggle;
    private changedEventHandler: event.ActionEventDispatcher<formHelper.IFormValue> = null;
    protected name: string;
    protected buildName: string;
    protected bindings: BindingCollection;
    protected generated: boolean;
    protected displayExpression: expression.ExpressionTree;
    protected elements: HTMLInputElement[] = [];
    protected nullElement: HTMLInputElement = null;
    private disabled: boolean;

    constructor(args: IFormValueBuilderArgs) {
        this.itemsView = args.bindings.getView<any>("items");
        this.name = args.item.name;
        this.buildName = args.item.buildName;
        this.bindings = args.bindings;
        this.generated = args.generated;
        this.displayExpression = args.item.displayExpression;
        this.disabled = args.item["x-ui-disabled"] === true || args.item.readOnly === true;
        this.changedEventHandler = new event.ActionEventDispatcher<formHelper.IFormValue>();

        var uidCount = 0;
        var iter = new iterable.Iterable(args.item.buildValues).select(i => {
            var shadow = Object.create(i);
            shadow.name = this.buildName;
            shadow.uniqueId = args.item.uniqueId + "-hr-item-id-" + uidCount++;
            return shadow;
        });
        this.itemsView.setData(iter, (created, item) => this.radioElementCreated(created, item));

        this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
        this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
        this.hideToggle = this.bindings.getToggle(this.buildName + "Hide");
    }

    public addOption(label: string, value: any) {
        this.itemsView.appendData({label: label, value: value}, (created, item) => this.radioElementCreated(created, item));
    }

    public setError(err: FormErrors, baseName: string) {
        var errorName = err.addKey(baseName, this.name);
        if (err.hasValidationError(errorName)) {
            this.errorToggle.on();
            this.errorMessage.setData(err.getValidationError(errorName));
        }
        else {
            this.errorToggle.off();
            this.errorMessage.setData("");
        }
    }

    public getData(): any {
        for (var i = 0; i < this.elements.length; ++i) {
            var radio = this.elements[i];
            if (radio.checked) {
                if (radio === this.nullElement) {
                    return null;
                }
                return formHelper.readValue(radio);
            }
        }
        return undefined;
    }

    public setData(data: any) {
        this.doSetValue(data);
        this.setError(formHelper.getSharedClearingValidator(), "");
    }

    /**
     * This function actually sets the value for the element, if you are creating a subclass for BasicItemEditor
     * you should override this function to actually set the value instead of overriding setData,
     * this way the other logic for setting data (getting the actual data, clearing errors, computing defaults) can
     * still happen. There is no need to call super.doSetData as that will only set the data on the form
     * using the formHelper.setValue function.
     * @param itemData The data to set for the item, this is the final value that should be set, no lookup needed.
     */
    protected doSetValue(itemData: any) {
        if (itemData !== null && itemData !== undefined) {
            for (var i = 0; i < this.elements.length; ++i) {
                var check = this.elements[i];
                if (check.value === itemData) {
                    formHelper.setValue(<any>check, true);
                }
            }
        }
        else {
            if (this.nullElement !== null) {
                formHelper.setValue(<any>this.nullElement, true);
            }
        }
    }

    public getBuildName(): string {
        return this.buildName;
    }

    public getDataName(): string {
        return this.name;
    }

    public delete(): boolean {
        if (this.generated) {
            this.bindings.remove();
        }
        return this.generated;
    }

    public get isChangeTrigger(): boolean {
        return this.changedEventHandler !== null;
    }

    public get onChanged() {
        if (this.changedEventHandler !== null) {
            return this.changedEventHandler.modifier;
        }
        return null;
    }

    public get respondsToChanges() {
        return this.displayExpression !== undefined;
    }

    public handleChange(values: expression.IValueSource): void {
        if (this.displayExpression) {
            if (this.displayExpression.isTrue(values)) {
                this.hideToggle.off();
            }
            else {
                this.hideToggle.on();
            }
        }
    }

    private radioElementCreated(created, item) {
        var element = created.getHandle("radio");

        //If this is the null value item, keep track of its element separately
        if (item.value === null) {
            this.nullElement = element;
        }

        this.elements.push(element);
        element.addEventListener("change", e => {
            this.changedEventHandler.fire(this);
        });

        if (this.disabled) {
            element.setAttribute("disabled", "");
        }
    }
}

export class IFormValueBuilderArgs {
    item: schemaprocessor.ProcessedJsonProperty;
    bindings: BindingCollection;
    generated: boolean;
    schema: JsonSchema;
    inputElement: HTMLElement;
    searchResultProviderFactory: SearchResultProviderFactory;
    formValues: FormValues;
}

export interface IFormValueBuilder {
    create(args: IFormValueBuilderArgs): formHelper.IFormValue | null;
}

export interface ProcessedFormJsonProperty extends schemaprocessor.ProcessedJsonProperty {
    formItemClass?: string;
}

function processFormProperty(prop: JsonProperty, schema: JsonSchema, uniqueId: string, name: string, buildName: string, formItemClass: string): ProcessedFormJsonProperty {
    var result: ProcessedFormJsonProperty = schemaprocessor.processProperty(prop, schema, uniqueId, name, buildName);
    if (formItemClass !== null) {
        result.formItemClass = formItemClass; //Don't include this if the attribute came back null
    }
    return result;
}

var propertyUniqueIndex = new InfiniteIndex();
function getNextIndex(){
    return "hr-form-prop-" + propertyUniqueIndex.getNext();
}

function buildForm(componentName: string, schema: JsonSchema, parentElement: HTMLElement, baseName?: string, ignoreExisting?: boolean, formValues?: FormValues): FormValues {
    if (ignoreExisting === undefined) {
        ignoreExisting = false;
    }

    if (baseName === undefined) {
        baseName = "";
    }

    if (formValues === undefined) {
        formValues = new FormValues();
    }

    var formItemClass = parentElement.getAttribute("data-hr-form-item-class");

    var dynamicInsertParent = parentElement;
    var dynamicInsertElement = domquery.first("[data-hr-form-end]", parentElement);
    if (dynamicInsertElement !== null) {
        //Adjust parent to end element if one was found
        dynamicInsertParent = dynamicInsertElement.parentElement;
    }
    var propArray: ProcessedFormJsonProperty[] = [];
    var props = schema.properties;
    if (props === undefined) {
        //No props, add the schema itself as a property, this also means our formValues are simple values
        propArray.push(processFormProperty(schema, schema, getNextIndex(), baseName, baseName, formItemClass));
        formValues.setComplex(false);
    }
    else {
        //There are properties, so the formValues are complex values
        formValues.setComplex(true);

        var baseNameWithSep = baseName;
        if (baseNameWithSep !== "") {
            baseNameWithSep = baseNameWithSep + '-';
        }

        for (var key in props) {
            propArray.push(processFormProperty(props[key], schema, getNextIndex(), key, baseNameWithSep + key, formItemClass));
        }

        propArray.sort((a, b) => {
            return a.buildOrder - b.buildOrder;
        });
    }

    for (var i = 0; i < propArray.length; ++i) {
        var item = propArray[i];
        var existing = <HTMLElement>domquery.first('[name=' + item.name + ']', parentElement);
        var bindings: BindingCollection = null;
        var generated = false;
        if (ignoreExisting || existing === null) {

            var placeholder = <HTMLElement>domquery.first('[data-hr-form-place=' + item.name + ']', parentElement);
            var insertElement = dynamicInsertElement;
            var insertParent = dynamicInsertParent;
            if(placeholder !== null){
                insertElement = placeholder;
                insertParent = insertElement.parentElement;
            }

            //Create component if it is null
            var actualComponentName = (item.xUi && item.xUi.overrideComponent) || componentName;
            if (!component.isDefined(actualComponentName)) {
                //If the component is not defined, fall back to the original
                actualComponentName = componentName;
            }
            bindings = component.one(actualComponentName, new FormComponentTextStream(item), insertParent, insertElement, undefined, (i) => {
                return (<FormComponentTextStream>i).getDataObject().buildType;
            });

            //Refresh existing, should be found now, when doing this always grab the last match.
            var elements = domquery.all('[name=' + item.buildName + ']', parentElement);
            if (elements.length > 0) {
                existing = elements[elements.length - 1];
            }
            else {
                existing = null;
            }

            generated = true;
        }
        else {
            //If this was an exising element, see if we should reuse what was found before, if the formValues already has an item, do nothing here
            if (!formValues.hasFormValue(item.buildName)) {
                //Not found, try to create a binding collection for it
                //Walk up element parents trying to find one with a data-hr-input-start attribute on it.
                var bindParent = existing;
                while (bindings === null && bindParent !== null && bindParent !== parentElement) {
                    if (bindParent.hasAttribute("data-hr-input-start")) {
                        bindings = new BindingCollection(bindParent);
                    }
                    else {
                        bindParent = bindParent.parentElement;
                    }
                }

                if (bindings === null) { //Could not find form data-hr-input-start element, just use the element as the base for the binding collection
                    bindings = new BindingCollection(existing);
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
                inputElement: existing,
                searchResultProviderFactory: SearchResultProvider,
                formValues: formValues
            }));
        }

        //If this is a child form, mark the element as a child so the form serializer will ignore it
        if (IsElement(existing)) {
            existing.setAttribute("data-hr-form-level", baseName);
        }
    }

    return formValues;
}

function createBindings(args: IFormValueBuilderArgs): formHelper.IFormValue {
    //See if there is a custom handler first
    for (var i = 0; i < formValueBuilders.length; ++i) {
        var created = formValueBuilders[i].create(args);
        if (created !== null) {
            return created;
        }
    }

    if (args.item.buildType === "arrayEditor") {
        let itemSchema: JsonSchema = resolveRef(<RefNode>args.item.items, args.schema);
        //This will treat the schema as a root schema, so setup parent if needed
        if (itemSchema !== args.schema) { //Make sure we didnt just get the original schema back
            //If so, set the parent 
            itemSchema = Object.create(itemSchema);
            itemSchema.parent = args.schema;
        }
        return new ArrayEditor(args, itemSchema);
    }
    else if (args.item.buildType === "objectEditor") {
        let objectSchema: JsonSchema = getOneOfSchema(args.item, args.schema);
        //This will treat the schema as a root schema, so setup parent if needed
        if (objectSchema !== args.schema) { //Make sure we didnt just get the original schema back
            //If so, set the parent 
            objectSchema = Object.create(objectSchema);
            objectSchema.parent = args.schema;
        }
        return new ObjectEditor(args, objectSchema);
    }
    else if (args.item.buildType === "multicheckbox") {
        return new MultiCheckBoxEditor(args);
    }
    else if (args.item.buildType === "radiobutton") {
        return new RadioButtonEditor(args);
    }
    else if(args.item.buildType === "search"){
        return new SearchItemEditor(args);
    }
    else {
        return new BasicItemEditor(args);
    }
}

function IsElement(element: Node): element is HTMLElement {
    return element && (element.nodeName !== undefined);
}

function IsSelectElement(element: Node): element is HTMLSelectElement {
    return element && (element.nodeName === 'SELECT');
}

function HasDatalist(element: Node): element is HTMLInputElement {
    return element && (element.nodeName === 'INPUT' && (<HTMLInputElement>element).list !== null && (<HTMLInputElement>element).list !== undefined);
}

var formValueBuilders: IFormValueBuilder[] = [];

export function registerFormValueBuilder(builder: IFormValueBuilder) {
    formValueBuilders.push(builder);
}

//Register form build function
formHelper.setBuildFormFunc(buildForm);

class FormComponentTextStream implements ITextStreamData {
    constructor(public data: schemaprocessor.ProcessedJsonProperty) {
    }

    getDataObject(): schemaprocessor.ProcessedJsonProperty {
        return this.data;
    }

    getRawData(address: expression.IDataAddress) {
        return address.read(this.data);
    }
    getFormatted(data: any, address: expression.IDataAddress) {
        if (data !== undefined) { //Don't return undefined, return empty string instead
            return data;
        }
        return "";
    }
}

export function setup() {
    //Doesn't do anything, but makes module load correctly.
    return true;
}