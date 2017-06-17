import { TextStream } from 'hr.textstream';
import * as components from 'hr.components';
import * as typeId from 'hr.typeidentifiers';
import * as domQuery from 'hr.domquery';
import * as iter from 'hr.iterable';

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
     * Clear all data from the model.
     */
    clear(): void;

    /**
     * Get the data source for the model.
     */
    getSrc(): string;
}

class ComponentView<T> implements IView<T> {
    constructor(private element: HTMLElement, private src: string, private component: string){

    }

    public setData(data: T | T[] | iter.IterableInterface<T>, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>): void {
        components.empty(this.element);
        this.appendData(data, createdCallback, variantFinderCallback);
    }

    public appendData(data: T | T[] | iter.IterableInterface<T>, createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>): void {
        if (typeId.isArray(data) || typeId.isForEachable(data)) {
            components.repeat(this.component, this.element, data, createdCallback, variantFinderCallback);
        }
        else if (data !== undefined && data !== null) {
            components.single(this.component, this.element, data, createdCallback, variantFinderCallback);
        }
    }

    public clear(): void {
        components.empty(this.element);
    }

    public getSrc(): string {
        return this.src;
    }
}

class TextNodeView<T> implements IView<T> {
    private dataTextElements = undefined;

    constructor(private element: HTMLElement, private src: string){

    }

    public setData(data: T): void {
        this.dataTextElements = bindData(data, this.element, this.dataTextElements);
    }

    public appendData(data: T): void {
        this.dataTextElements = bindData(data, this.element, this.dataTextElements);
    }

    public clear(): void {
        this.dataTextElements = bindData(sharedClearer, this.element, this.dataTextElements);
    }

    public getSrc(): string {
        return this.src;
    }
}

class NullView<T> implements IView<T> {
    constructor(){

    }

    public setData(data): void {

    }

    public appendData(data): void {

    }

    public clear(): void {

    }

    public getSrc() {
        return "";
    }
}

function IsHTMLElement(element: Node): element is HTMLElement{
    //Just check a couple functions, no need to go overboard, only comparing to node anyway
    return element && element.nodeType == 1;
}

export function build<T>(element: Node) : IView<T> {
    if(IsHTMLElement(element)){
        var src = element.getAttribute('data-hr-model-src');
        var component = element.getAttribute('data-hr-model-component');
        if (component) {
            return new ComponentView<T>(element, src, component);
        }
        else {
            return new TextNodeView<T>(element, src);
        }
    }
    return new NullView<T>();
}

interface DataTextElement{
    node: Node
    stream: TextStream
}

function bindData(data: any, element: HTMLElement, dataTextElements: DataTextElement[]): DataTextElement[] {
    //No found elements, iterate everything.
    if (dataTextElements === undefined) {
        dataTextElements = [];
        domQuery.iterateNodes(element, NodeFilter.SHOW_TEXT, function (node) {
            var textStream = new TextStream(node.textContent);
            if (textStream.foundVariable()) {
                node.textContent = textStream.format(data);
                dataTextElements.push({
                    node: node,
                    stream: textStream
                });
            }
        });
    }
    //Already found the text elements, output those.
    else {
        for (var i = 0; i < dataTextElements.length; ++i) {
            var node = dataTextElements[i];
            node.node.textContent = node.stream.format(data);
        }
    }

    return dataTextElements;
}

function sharedClearer(i: number) {
    return "";
}