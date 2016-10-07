"use strict";

import {BindingCollection} from 'hr.bindingcollection';
import * as domQuery from 'hr.domquery';
import * as ignoredNodes from 'hr.ignored';

/**
 * Create controller instances for all controllers named name using the given controllerConstructor function.
 * The created controllers will automatically be assigned as a listener to the bindings. This way the object
 * you create with your constructor funciton can define the main functions for the controller.
 * @param {type} name
 * @param {type} controllerConstructor
 */
export function create(name, controllerConstructor, context, parentBindings?) :any[]{
    var createdControllers = [];

    function foundElement(element) {
        if (!ignoredNodes.isIgnored(element)) {
            var bindings = new BindingCollection(element);
            var controller = new controllerConstructor(bindings, context, null);
            bindings.setListener(controller);
            element.removeAttribute('data-hr-controller');
            createdControllers.push(controller);
        }
    }

    if (parentBindings) {
        parentBindings.iterateControllers(name, foundElement);
    }
    else {
        domQuery.iterate('[data-hr-controller="' + name + '"]', null, foundElement);
    }

    return createdControllers;
}

/**
 * This function will return a function that will create a controller when called with a BindingCollection inside.
 * This can be used in the callbacks for setData in model and when creating components.
 * @param {type} controllerConstructor
 */
export function createOnCallback(controllerConstructor, context?:any) {
    return function (bindings, data) {
        var controller = new controllerConstructor(bindings, context, data);
        bindings.setListener(controller);
    }
}