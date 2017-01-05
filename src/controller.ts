"use strict";

import { BindingCollection } from 'hr.bindingcollection';
export { BindingCollection } from 'hr.bindingcollection';
export { Model } from 'hr.models';
import * as domQuery from 'hr.domquery';
import * as ignoredNodes from 'hr.ignored';
import { ActionEventDispatcher } from 'hr.eventdispatcher';

/**
 * This interface describes a type that has a constructor that converts
 * a raw javascript object to a typed version of that object.
 */
export interface ControllerConstructor<ContextType, DataType> {
    new (bindings: BindingCollection, context?: ContextType, data?: DataType);
}

/**
 * Create controller instances for all controllers named name using the given controllerConstructor function.
 * The created controllers will automatically be assigned as a listener to the bindings. This way the object
 * you create with your constructor funciton can define the main functions for the controller.
 * @param {type} name
 * @param {type} controllerConstructor
 */
export function create<ControllerType, ContextType, DataType>(name: string, controllerConstructor: ControllerConstructor<ContextType, DataType>, context?: ContextType, parentBindings?: BindingCollection): ControllerType[] {
    var builder = new ControllerBuilder<ControllerType, ContextType, DataType>(controllerConstructor);
    builder.context = context;
    return builder.create(name, parentBindings);
}

/**
 * This function will return a function that will create a controller when called with a BindingCollection inside.
 * This can be used in the callbacks for setData in model and when creating components.
 * @param {type} controllerConstructor
 */
export function createOnCallback<ControllerType, ContextType, DataType>(controllerConstructor: ControllerConstructor<ContextType, DataType>, context?: ContextType) {
    var builder = new ControllerBuilder<ControllerType, ContextType, DataType>(controllerConstructor);
    builder.context = context;
    return builder.createOnCallback();
}

/**
 * This class builds controllers and holds configuration data.
 * @param {type} controllerConstructor The controller's constructor function, in typescript pass the class name.
 * @returns A new ControllerBuilder.
 */
export class ControllerBuilder<ControllerType, ContextType, DataType> {
    private controllerConstructor: ControllerConstructor<ContextType, DataType>;
    private _context: ContextType;
    private controllerCreatedEvent = new ActionEventDispatcher<ControllerType>();

    /**
     * Create a new ControllerBuilder
     * @param {type} controllerConstructor
     */
    constructor(controllerConstructor: ControllerConstructor<ContextType, DataType>, context?: ContextType) {
        this.controllerConstructor = controllerConstructor;
        this._context = context;
    }

    /**
     * The value to pass to a controller's context variable.
     * @returns The context.
     */
    get context(): ContextType {
        return this._context;
    }
    set context(value: ContextType) {
        this._context = value;
    }

    get controllerCreated() {
        return this.controllerCreatedEvent.modifier;
    }

    create(name: string, parentBindings?: BindingCollection): ControllerType[] {
        var createdControllers: ControllerType[] = [];

        var foundElement = (element) => {
            if (!ignoredNodes.isIgnored(element)) {
                var bindings = new BindingCollection(element);
                var controller = new this.controllerConstructor(bindings, this.context, null);
                bindings.setListener(controller);
                element.removeAttribute('data-hr-controller');
                createdControllers.push(controller);
                this.controllerCreatedEvent.fire(controller);
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
     * This will create a callback function that will create a new controller when it is called.
     * @returns
     */
    createOnCallback(): (bindings: BindingCollection, data: DataType) => void {
        return (bindings: BindingCollection, data: DataType) => {
            var controller = new this.controllerConstructor(bindings, this.context, data);
            bindings.setListener(controller);
            this.controllerCreatedEvent.fire(controller);
        }
    }
}