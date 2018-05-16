///<amd-module name="hr.bindingcollection"/>

"use strict";

import * as escape from 'hr.escape';
import * as typeId from 'hr.typeidentifiers';
import * as domQuery from 'hr.domquery';
import * as TextStream from 'hr.textstream';
import * as toggles from 'hr.toggles';
import * as models from 'hr.models';
import * as form from 'hr.form';
import * as view from 'hr.view';

function EventRunner(name: string, listener: any) {
    this.execute = function (evt: Event) {
        var cb = listener[name];
        if (cb) {
            cb.call(listener, evt);
        }
    }
}

function bindEvents(elements: HTMLElement[], listener: any) {
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        domQuery.iterateElementNodes(element, function (node) {
            //Look for attribute
            for (var i = 0; i < node.attributes.length; i++) {
                var attribute = node.attributes[i];
                if ((<any>attribute.name).startsWith('data-hr-on-')) {
                    var eventFunc = attribute.value;
                    if (listener[eventFunc]) {
                        var runner = new EventRunner(eventFunc, listener);
                        node.addEventListener(attribute.name.substr(11), runner.execute);
                    }
                }
            }
        });
    }
}

function getToggle(name: string, elements: HTMLElement[], typedToggle: toggles.TypedToggle) {
    var states = typedToggle.getPossibleStates();
    var toggleArray: toggles.IToggleStates[] = [];
    var query = '[data-hr-toggle=' + name + ']';
    var startState = null;
    //Find all the toggles in the collection with the given name
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        var toggleElements = domQuery.all(query, element);
        for (var i = 0; i < toggleElements.length; ++i) {
            toggleArray.push(toggles.build(toggleElements[i], states));
            startState = startState ? startState : toggles.getStartState(toggleElements[i]);
        }
    }
    if (toggleArray.length === 0) {
        //Nothing, null toggle
        typedToggle.setStates(toggles.build(null, states));
    }
    else if (toggleArray.length === 1) {
        //One thing, use toggle state directly
        typedToggle.setStates(toggleArray[0]);
    }
    else {
        //Multiple things, create a multi state and use that
        typedToggle.setStates(new toggles.MultiToggleStates(toggleArray));
    }

    if (startState != null) {
        typedToggle.applyState(startState);
    }
}

function getModel<T>(name: string, elements: HTMLElement[]): models.Model<T> {
    var model: models.Model<T>;
    var query = '[data-hr-model=' + name + ']';
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        var targetElement = domQuery.first(query, element);
        if (targetElement) {
            model = models.build<T>(targetElement);
            return model; //Found it, need to break element loop, done here if found
        }
        else {
            model = null;
        }
    }

    if (model === null) {
        model = <models.Model<T>>(new models.NullModel());
    }

    return model;
}

function getHandle(name: string, elements: HTMLElement[]): HTMLElement {
    var model;
    var query = '[data-hr-handle=' + name + ']';
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        var targetElement = domQuery.first(query, element);
        if (targetElement && targetElement instanceof HTMLElement) {
            return targetElement;
        }
    }

    return null;
}

function getConfig(elements: HTMLElement[]) {
    var data = {};
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        domQuery.iterateElementNodes(element, function (node) {
            //Look for attribute
            for (var i = 0; i < node.attributes.length; i++) {
                var attribute = node.attributes[i];
                if ((<any>attribute.name).startsWith('data-hr-config-')) {
                    data[attribute.name.substr(15)] = attribute.value;
                }
            }
        });
    }
    return data;
}

function iterateControllers(name: string, elements: HTMLElement[], cb: domQuery.ElementIteratorCallback) {
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        domQuery.iterate('[data-hr-controller="' + name + '"]', element, cb);
    }
}

export class PooledBindings{
    constructor(private docFrag: DocumentFragment, private parent: Node){

    }

    public restore(insertBefore: Node){
        this.parent.insertBefore(this.docFrag, insertBefore);
    }
}

/**
 * The BindingCollection class allows you to get access to the HtmlElements defined on your
 * page with objects that help manipulate them. You won't get the elements directly and you
 * should not need to, using the interfaces should be enough.
 */
export class BindingCollection {
    private elements: HTMLElement[];

    constructor(elements) {
        this.elements = domQuery.all(elements);
    }

    /**
     * Set the listener for this binding collection. This listener will have its functions
     * fired when a matching event is fired.
     * @param {type} listener
     */
    public setListener(listener: any): void {
        bindEvents(this.elements, listener);
    }

    /**
     * Get a named toggle, this will always be an on off toggle.
     */
    public getToggle(name: string): toggles.OnOffToggle {
        var toggle = new toggles.OnOffToggle();
        getToggle(name, this.elements, toggle);
        return toggle;
    }

    /**
     * Get a named toggle, this will use the passed in custom toggle instance. Using this you can define
     * states other than on and off.
     */
    public getCustomToggle<T extends toggles.TypedToggle>(name: string, toggle: T): T {
        getToggle(name, this.elements, toggle);
        return toggle;
    }

    /**
     * @deprecated
     * THIS IS DEPRECATED use getForm and getView instead.
     * Get a named model. Can also provide a StrongTypeConstructor that will be called with new to create
     * the instance of the data pulled from the model. If you don't provide this the objects will be plain
     * javascript objects.
     */
    public getModel<T>(name: string, strongConstructor?: models.StrongTypeConstructor<T>): models.Model<T> {
        var model = getModel<T>(name, this.elements);
        if (strongConstructor !== undefined) {
            model = new models.StrongTypedModel<T>(model, strongConstructor);
        }
        return model;
    }

    /**
     * Get the config for this binding collection.
     */
    public getConfig<T>(): T {
        return <T>getConfig(this.elements);
    }

    /**
     * Get a handle element. These are direct references to html elements for passing to third party libraries
     * that need them. Don't use these directly if you can help it.
     */
    public getHandle(name: string): HTMLElement {
        return getHandle(name, this.elements);
    }

    /**
     * Iterate over all the controllers in the BindingCollection.
     */
    public iterateControllers(name: string, cb: domQuery.ElementIteratorCallback): void {
        iterateControllers(name, this.elements, cb);
    }

    /**
     * Get a named form, will return a valid IForm object no matter what, but that object
     * might not actually be a rea form on the document if name does not exist.
     * @param name The name of the form to lookup.
     */
    public getForm<T>(name: string): form.IForm<T> {
        var query = '[data-hr-form=' + name + ']';
        var targetElement = this.findElement(query);

        //Backward compatibility with model
        if(targetElement === null){
            query = '[data-hr-model=' + name + ']';
            targetElement = this.findElement(query);
        }

        return form.build<T>(targetElement);
    }

    /**
     * Get a named view, will return a valid IView object no matter what, but that object
     * might not actually be a real view on the document if name does not exist.
     * @param name The name of the view to lookup
     */
    public getView<T>(name: string): view.IView<T> {
        var query = '[data-hr-view=' + name + ']';
        var targetElement = this.findElement(query);

        //Backward compatibility with model
        if(targetElement === null){
            query = '[data-hr-model=' + name + ']';
            targetElement = this.findElement(query);
        }

        return view.build<T>(targetElement);
    }

    private findElement(query: string): Node{
        for (var eIx = 0; eIx < this.elements.length; ++eIx) {
            var element = this.elements[eIx];
            var targetElement = domQuery.first(query, element);
            if (targetElement) {
                //Found it, return now
                return targetElement;
            }
        }
        return null; //Not found, return null
    }

    /**
     * Return the "root" html element for this binding collection. If there is more
     * than one element, the first one will be returned and null will be returned if
     * there is no root element. Ideally you would not use this directly, but it is
     * useful to insert nodes before a set of bound elements.
     */
    public get rootElement(): HTMLElement{
        return this.elements.length > 0 ? this.elements[0] : null;
    }

    /**
     * Remove all contained elements from the document. Be sure to use this to 
     * remove the collection so all elements are properly removed.
     */
    public remove(): void{
        for (var eIx = 0; eIx < this.elements.length; ++eIx) {
            this.elements[eIx].remove();
        }
    }

    /**
     * Pool the elements into a document fragment. Will return a pooled bindings
     * class that can be used to restore the pooled elements to the document.
     */
    public pool(): PooledBindings{
        var parent = this.elements[0].parentElement;
        var docFrag = document.createDocumentFragment();
        for (var eIx = 0; eIx < this.elements.length; ++eIx) {
            docFrag.appendChild(this.elements[eIx]);
        }
        return new PooledBindings(docFrag, parent);
    }
};