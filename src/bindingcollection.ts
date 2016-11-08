﻿"use strict";

import * as escape from 'hr.escape';
import * as typeId from 'hr.typeidentifiers';
import * as domQuery from 'hr.domquery';
import * as TextStream from 'hr.textstream';
import * as toggles from 'hr.toggles';
import * as models from 'hr.models';

function EventRunner(name, listener) {
    this.execute = function (evt) {
        var cb = listener[name];
        if (cb) {
            cb.call(listener, evt);
        }
    }
}

function bindEvents(elements, listener) {
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        domQuery.iterateNodes(element, NodeFilter.SHOW_ELEMENT, function (node) {
            //Look for attribute
            for (var i = 0; i < node.attributes.length; i++) {
                var attribute = node.attributes[i];
                if (attribute.name.startsWith('data-hr-on-')) {
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

function getToggle(name, elements, states) {
    var toggle;
    var query = '[data-hr-toggle=' + name + ']';
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        var toggleElement = domQuery.first(query, element);
        if (toggleElement) {
            toggle = toggles.build(toggleElement, states);
            return toggle; //Found it, need to break element loop, done here if found
        }
        else {
            toggle = null;
        }
    }

    if (toggle === null) {
        toggle = toggles.build(null, states);
    }

    return toggle;
}

function getModel<T>(name, elements): models.Model<T> {
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

function getHandle(name, elements) {
    var model;
    var query = '[data-hr-handle=' + name + ']';
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        var targetElement = domQuery.first(query, element);
        if (targetElement) {
            return targetElement;
        }
    }

    return null;
}

function getConfig(elements) {
    var data = {};
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        domQuery.iterateNodes(element, NodeFilter.SHOW_ELEMENT, function (node) {
            //Look for attribute
            for (var i = 0; i < node.attributes.length; i++) {
                var attribute = node.attributes[i];
                if (attribute.name.startsWith('data-hr-config-')) {
                    data[attribute.name.substr(15)] = attribute.value;
                }
            }
        });
    }
    return data;
}

function iterateControllers(name, elements, cb) {
    for (var eIx = 0; eIx < elements.length; ++eIx) {
        var element = elements[eIx];
        domQuery.iterate('[data-hr-controller="' + name + '"]', element, function (cntrlElement) {
            cb(cntrlElement);
        });
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
    setListener(listener:any) {
        bindEvents(this.elements, listener);
    }

    /**
     * Get a named toggle. Can also provide custom states, otherwise these will default to on and off.
     */
    getToggle(name:string, states?:any) : toggles.Toggle {
        return getToggle(name, this.elements, states);
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
    getHandle(name:string) {
        return getHandle(name, this.elements);
    }

    /**
     * Iterate over all the controllers in the BindingCollection.
     */
    iterateControllers(name:string, cb) {
        iterateControllers(name, this.elements, cb);
    }
};