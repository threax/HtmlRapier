///<amd-module name="hr.view"/>

import { TextStream } from 'hr.textstream';
import * as components from 'hr.components';
import * as typeId from 'hr.typeidentifiers';
import * as domQuery from 'hr.domquery';
import * as iter from 'hr.iterable';
import { Extractor, IViewDataFormatter, IViewDataFormatterWithExternal, IDataResolver, DataResolver } from 'hr.viewformatter';
export { SchemaViewFormatter as SchemaViewDataFormatter, Extractor, IViewDataFormatter, IViewDataFormatterWithExternal } from 'hr.viewformatter';

/**
 * The basic interface for view instances.
 * The type T is always going to be a non array
 * view of whatever you want to put in, since the
 * setData function can take the array version of T.
 * Only use an array for T if you want an array of arrays.
 */
export interface IView<T>{
    /**
     * Set the data on the view.
     */
    setData(data: T | T[] | iter.IterableInterface<T>, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>): void;

    /**
     * Add more data to the model, does not erase existing data.
     */
    appendData(data: T | T[] | iter.IterableInterface<T>, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>): void;

    /**
     * Insert more data in the model, does not erase existing data.
     */
    insertData(data: T | T[] | iter.IterableInterface<T>, insertBeforeSibling: Node, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>): void;

    /**
     * Clear all data from the model.
     */
    clear(): void;

    /**
     * Set the formater to use when reading values out of the data.
     */
    setFormatter(formatter: IViewDataFormatter<T>): void;

    /**
     * Visit each variable name for this view.
     * @param foundCb The function that is called with each variable name when found.
     */
    visitVariables(data: T, foundCb: components.VisitVariableCallback, variantFinderCallback?: components.VariantFinderCallback<T>): void;
}

class ComponentView<T> implements IView<T> {
    private formatter: IViewDataFormatter<T>;

    constructor(private element: HTMLElement, private component: string){

    }

    public setData(data: T | T[] | iter.IterableInterface<T>, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>): void {
        components.empty(this.element);
        this.insertData(data, null, createdCallback, variantFinderCallback);
    }

    public appendData(data: T | T[] | iter.IterableInterface<T>, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>): void {
        this.insertData(data, null, createdCallback, variantFinderCallback);
    }

    public insertData(data: T | T[] | iter.IterableInterface<T>, insertBeforeSibling: Node, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>): void {
        if (Array.isArray(data) || typeId.isForEachable(data)) {
            if(this.formatter !== undefined){
                var dataExtractors = new iter.Iterable(<T[]>data).select<Extractor<T>>(i => {
                    return this.formatter.convert(i);
                });
                components.many<Extractor<T>>(this.component, dataExtractors, this.element, insertBeforeSibling,
                    createdCallback === undefined ? undefined : (b, e) => {
                        return createdCallback(b, e.original);
                    }, 
                    variantFinderCallback === undefined ? undefined : (i) => {
                        return variantFinderCallback(i.original);
                    });
            }
            else{
                components.many<T>(this.component, data, this.element, insertBeforeSibling, createdCallback, variantFinderCallback);
            }
        }
        else if (data !== undefined && data !== null) {
            if(this.formatter !== undefined){
                components.one(this.component, this.formatter.convert(<T>data), this.element, insertBeforeSibling, 
                    createdCallback === undefined ? undefined : (b, e) => {
                        return createdCallback(b, e.original);
                    }, 
                    variantFinderCallback === undefined ? undefined : (i) => {
                        return variantFinderCallback(i.original);
                    });
            }
            else{
                components.one(this.component, data, this.element, insertBeforeSibling, createdCallback, variantFinderCallback);
            }
        }
    }

    public clear(): void {
        components.empty(this.element);
    }

    public setFormatter(formatter: IViewDataFormatter<T>): void {
        this.formatter = formatter;
    }

    visitVariables(data: any, foundCb: components.VisitVariableCallback, variantFinderCallback?: components.VariantFinderCallback<T>): void {
        components.visitVariables(this.component, data, foundCb, variantFinderCallback);
    }
}

class TextNodeView<T> implements IView<T> {
    private formatter: IViewDataFormatter<T>;
    private dataTextElements: DataTextElement[] = undefined;

    constructor(private element: HTMLElement){

    }

    public setData(data: T): void {
        this.insertData(data);
    }

    public appendData(data: T): void {
        this.insertData(data);
    }

    public insertData(data: T | T[] | iter.IterableInterface<T>): void{
        if(this.formatter !== undefined){
            var extractor = this.formatter.convert(<T>data);
            this.bindData(extractor);
        }
        else{
            this.bindData(data);
        }
    }

    public clear(): void {
        this.bindData(sharedClearer);
    }

    public setFormatter(formatter: IViewDataFormatter<T>): void {
        this.formatter = formatter;
    }

    visitVariables(data: any, foundCb: components.VisitVariableCallback, variantFinderCallback?: components.VariantFinderCallback<T>): void {
        this.ensureDataTextElements();
        for (var i = 0; i < this.dataTextElements.length; ++i) {
            this.dataTextElements[i].stream.visitVariables(foundCb);
        }
    }

    private bindData(data: any): void {
        this.ensureDataTextElements();
        for (var i = 0; i < this.dataTextElements.length; ++i) {
            var node = this.dataTextElements[i];
            node.node.textContent = node.stream.format(data);
        }
    }

    private ensureDataTextElements() {
        if (this.dataTextElements === undefined) {
            this.dataTextElements = [];
            domQuery.iterateNodes(this.element, NodeFilter.SHOW_TEXT, (node) => {
                var textStream = new TextStream(node.textContent, { escape: false }); //Since we are using textContent, there is no need to escape the input
                if (textStream.foundVariable()) {
                    this.dataTextElements.push({
                        node: node,
                        stream: textStream
                    });
                }
            });
        }
    }
}

class NullView<T> implements IView<T> {
    constructor(){

    }

    public setData(): void {

    }

    public appendData(): void {

    }

    public insertData(): void {

    }

    public clear(): void {

    }

    public setFormatter(formatter: IViewDataFormatter<T>): void {
        
    }

    visitVariables(data: any, foundCb: components.VisitVariableCallback, variantFinderCallback?: components.VariantFinderCallback<T>): void {
        
    }
}

function IsHTMLElement(element: Node): element is HTMLElement{
    //Just check a couple functions, no need to go overboard, only comparing to node anyway
    return element && element.nodeType == 1;
}

export function build<T>(element: Node) : IView<T> {
    if(IsHTMLElement(element)){

        var component: string;
        if(element.hasAttribute('data-hr-view-component')){
            component = element.getAttribute('data-hr-view-component');
        }
        else if(element.hasAttribute('data-hr-model-component')){ //Backward compatibility
            component = element.getAttribute('data-hr-model-component');
        }
        
        if (component) {
            return new ComponentView<T>(element, component);
        }
        else {
            return new TextNodeView<T>(element);
        }
    }
    return new NullView<T>();
}

interface DataTextElement{
    node: Node
    stream: TextStream
}

function sharedClearer(i: number) {
    return "";
}