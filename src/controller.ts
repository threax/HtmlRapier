"use strict";

import { BindingCollection } from 'hr.bindingcollection';
export { BindingCollection } from 'hr.bindingcollection';
export { Model } from 'hr.models';
import * as domQuery from 'hr.domquery';
import * as ignoredNodes from 'hr.ignored';
import { EventHandler } from 'hr.eventhandler';

/**
 * Create controller instances for all controllers named name using the given controllerConstructor function.
 * The created controllers will automatically be assigned as a listener to the bindings. This way the object
 * you create with your constructor funciton can define the main functions for the controller.
 * @param {type} name
 * @param {type} controllerConstructor
 */
export function create(name, controllerConstructor, context, parentBindings?): any[] {
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
export function createOnCallback(controllerConstructor, context?: any) {
    var builder = new ControllerBuilder(controllerConstructor);
    builder.context = context;
    return builder.createOnCallback();
}

/**
 * This class builds controllers and holds configuration data.
 * @param {type} controllerConstructor The controller's constructor function, in typescript pass the class name.
 * @returns A new ControllerBuilder.
 */
export class ControllerBuilder {
    private controllerConstructor;
    private _context: any;
    private controllerCreatedEvent: EventHandler;

    /**
     * Create a new ControllerBuilder
     * @param {type} controllerConstructor
     */
    constructor(controllerConstructor) {
        this.controllerConstructor = controllerConstructor;
        this.controllerCreatedEvent = new EventHandler();
    }

    /**
     * The value to pass to a controller's context variable.
     * @returns The context.
     */
    get context(): any {
        return this._context;
    }
    set context(value: any) {
        this._context = value;
    }

    get controllerCreated() {
        return this.controllerCreatedEvent.modifier;
    }

    /**
     * This will create a callback function that will create a new controller when it is called.
     * @returns
     */
    createOnCallback() {
        return (bindings, data) => {
            var controller = new this.controllerConstructor(bindings, this.context, data);
            bindings.setListener(controller);
            this.controllerCreatedEvent.fire(controller);
        }
    }
}