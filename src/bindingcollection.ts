"use strict";

import * as escape from 'hr.escape';
import * as typeId from 'hr.typeidentifiers';
import * as domQuery from 'hr.domquery';
import * as TextStream from 'hr.textstream';
import * as toggles from 'hr.toggles';
import * as models from 'hr.models';

function EventRunner(name: string, listener: any) {
    this.execute = function (evt) {
        var cb = listener[name];
        if (cb) {
            cb.call(listener, evt);
        }
    }
}

function bindEvents(elements: HTMLElement[], listener: any) {
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        domQuery.iterateNodes(element, NodeFilter.SHOW_ELEMENT, function (node) {
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
        model = new models.NullModel();
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
        domQuery.iterateNodes(element, NodeFilter.SHOW_ELEMENT, function (node) {
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

/**
 * The BindingCollection class allows you to get access to the HtmlElements defined on your
 * page with objects that help manipulate them. You won't get the elements directly and you
 * should not need to, using the interfaces should be enough.
 */
export class BindingCollection {
    private elements;

    constructor(elements) {
        this.elements = domQuery.all(elements);
    }

    /**
     * Set the listener for this binding collection. This listener will have its functions
     * fired when a matching event is fired.
     * @param {type} listener
     */
    setListener(listener: any) {
        bindEvents(this.elements, listener);
    }

    /**
     * Get a named toggle, this will always be an on off toggle.
     */
    getToggle(name: string): toggles.OnOffToggle {
        var toggle = new toggles.OnOffToggle();
        getToggle(name, this.elements, toggle);
        return toggle;
    }

    /**
     * Get a named toggle, this will use the passed in custom toggle instance. Using this you can define
     * states other than on and off.
     */
    getCustomToggle<T extends toggles.TypedToggle>(name: string, toggle: T) {
        getToggle(name, this.elements, toggle);
        return toggle;
    }

    /**
     * Get a named model. Can also provide a StrongTypeConstructor that will be called with new to create
     * the instance of the data pulled from the model. If you don't provide this the objects will be plain
     * javascript objects.
     */
    getModel<T>(name: string, strongConstructor?: models.StrongTypeConstructor<T>): models.Model<T> {
        var model = getModel<T>(name, this.elements);
        if (strongConstructor !== undefined) {
            model = new models.StrongTypedModel<T>(model, strongConstructor);
        }
        return model;
    }

    /**
     * Get the config for this binding collection.
     */
    getConfig<T>(): T {
        return <T>getConfig(this.elements);
    }

    /**
     * Get a handle element. These are direct references to html elements for passing to third party libraries
     * that need them. Don't use these directly if you can help it.
     */
    getHandle(name: string): HTMLElement {
        return getHandle(name, this.elements);
    }

    /**
     * Iterate over all the controllers in the BindingCollection.
     */
    iterateControllers(name: string, cb: domQuery.ElementIteratorCallback) {
        iterateControllers(name, this.elements, cb);
    }
};