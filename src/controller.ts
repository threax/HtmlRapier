///<amd-module name="hr.controller"/>

"use strict";

import { BindingCollection } from 'hr.bindingcollection';
export { BindingCollection } from 'hr.bindingcollection';
export { Model } from 'hr.models';
export { OnOffToggle, TypedToggle } from 'hr.toggles';
import * as domQuery from 'hr.domquery';
import * as ignoredNodes from 'hr.ignored';
import { ActionEventDispatcher } from 'hr.eventdispatcher';
import * as di from 'hr.di';
export { DiFunction, ServiceCollection, InjectableArgs } from 'hr.di';
export { IForm } from 'hr.form';
export { IView } from 'hr.view';

/**
 * This class provides a way to get a handle to the data provided by the
 * createOnCallback data argument. Return this type from your InjectorArgs
 * where you take the row data argument, and the appropriate data object
 * will be returned. There is only a need for one of these, since controllers
 * can only accept one piece of callback data.
 */
export abstract class InjectControllerData{
    //This is useless on its own, just provides a function based handle to data.
}

export type CreateCallback<T> = (bindings: BindingCollection, data: any) => T;

/**
 * This class builds controllers using dependency injection.
 * Controllers are pretty much normal dependency injected classes, they have no superclass and don't
 * have any constructor requirements, however, you might want to take controller.BindingCollection at a minimum.
 * In addition to this your controller can define a function called postBind that will be called after the 
 * controller's constructor and setting the controller as the binding collection listener. This is the best
 * place to create additional neseted controllers without messing up the binding collection.
 * 
 * The way to handle a controller is as follows:
 * 1. Create the controller class with any InjectorArgs defined that need to be injected, likely at a minimnum this is controller.BindingCollection
 * 2. Implement the constructor for the controller taking in arguments for everything you need injected.
 *    In the controller read anything you will need out of the BindingCollection, do not store it for later or read it later, it will change as the page
 *    changes, so if you have nested controllers they can potentially end up seeing each others elements.
 * 3. Implement protected postBind() to do any work that should happen after bindings are complete. This will fire after the constructor has run and after
 *    the new controller instance has bound its functions to the dom. Ideally this method is protected so subclasses can call it but nothing else in typescript
 *    can see it.
 */
export class InjectedControllerBuilder {
    private controllerCreatedEvent = new ActionEventDispatcher<any>();
    private serviceCollection: di.ServiceCollection;
    protected baseScope: di.Scope;

    /**
     * Create a new ControllerBuilder, can reference a parent controller by passing it.
     * @param controllerConstructor
     * @param scope The scope to use for dependency injection into the controller
     */
    constructor(scope?: di.Scope) {
        this.serviceCollection = new di.ServiceCollection();
        if(scope) {
            this.baseScope = scope.createChildScope(this.serviceCollection);
        }
        else {
            this.baseScope = new di.Scope(this.serviceCollection);
        }
    }

    /**
     * Get the service collection to define services for this builder. Don't create scopes with this
     * use createUnbound if you need to make an instance of something in the service collection, this 
     * will prevent your scopes from getting messed up.
     */
    public get Services(): di.ServiceCollection {
        return this.serviceCollection;
    }

    /**
     * This event is fired when this builder creates a controller.
     */
    public get controllerCreated() {
        return this.controllerCreatedEvent.modifier;
    }

    /**
     * Create a child builder from this controller builder, this allows you to add
     * shared instances to the child that will not be present in the parent.
     */
    public createChildBuilder(): InjectedControllerBuilder {
        return new InjectedControllerBuilder(this.baseScope.createChildScope(new di.ServiceCollection()));
    }

    /**
     * Create a new controller instance on the named nodes in the document.
     * @param name The name of the data-hr-controller nodes to lookup.
     * @param controllerConstructor The controller to create when a node is found.
     * @param parentBindings The parent bindings to restrict the controller search.
     */
    public create<T>(name: string, controllerConstructor: di.DiFunction<T>, parentBindings?: BindingCollection): T[] {
        return this.createId(undefined, name, controllerConstructor, parentBindings)
    }

    /**
     * Create a new controller instance on the named nodes in the document using an id based service.
     * @param name The name of the data-hr-controller nodes to lookup.
     * @param controllerConstructor The controller to create when a node is found.
     * @param parentBindings The parent bindings to restrict the controller search.
     */
    public createId<T, TId>(id: TId, name: string, controllerConstructor: di.DiFunction<T>, parentBindings?: BindingCollection): T[] {
        const createdControllers: T[] = [];

        const foundElement = (element) => {
            if (!ignoredNodes.isIgnored(element)) {
                const services = new di.ServiceCollection();
                const scope = this.baseScope.createChildScope(services);
                const bindings =  new BindingCollection(element);
                services.addTransient(BindingCollection, s => bindings);
                element.removeAttribute('data-hr-controller');
                const controller = this.createController(id, controllerConstructor, services, scope, bindings);
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
     * This will create a single instance of the service that resolves to constructorFunc 
     * without looking for html elements, it will not have a binding collection.
     * This can be used to create any kind of object, not just controllers. Do this for anything
     * you want to use from the service scope for this controller.
     */
    public createUnbound<T>(constructorFunc: di.DiFunction<T>): T {
        return this.createUnboundId(undefined, constructorFunc);
    }

    /**
     * This will create a single instance of the service that resolves to constructorFunc 
     * without looking for html elements, it will not have a binding collection.
     * This can be used to create any kind of object, not just controllers. Do this for anything
     * you want to use from the service scope for this controller. This verison works by creating
     * the version of a service with the given id.
     */
    public createUnboundId<T, TId>(id: TId, constructorFunc: di.DiFunction<T>): T {
        const services = new di.ServiceCollection();
        const scope = this.baseScope.createChildScope(services);
        services.addTransient(InjectedControllerBuilder, s => new InjectedControllerBuilder(scope));
        const controller = scope.getRequiredServiceId(id, constructorFunc);
        if ((controller as any).postBind !== undefined) {
            (controller as any).postBind();
        }
        this.controllerCreatedEvent.fire(controller);
        return controller;
    }

    /**
     * This will create a callback function that will create a new controller when it is called.
     * @returns
     */
    public createOnCallback<T>(controllerConstructor: di.DiFunction<T>): CreateCallback<T> {
        return this.createOnCallbackId(undefined, controllerConstructor);
    }

    /**
     * This will create a callback function that will create a new controller when it is called.
     * This version will use the service identified by id.
     * @returns
     */
    public createOnCallbackId<T, TId>(id: TId, controllerConstructor: di.DiFunction<T>): CreateCallback<T> {
        return (bindings: BindingCollection, data: any) => {
            const services = new di.ServiceCollection();
            const scope = this.baseScope.createChildScope(services);
            services.addTransient(BindingCollection, s => bindings);

            //If some data was provided, use it as our InjectControllerData service
            //for the newly created scope.
            if (data !== undefined) {
                services.addTransient(InjectControllerData, s => data);
            }

            return this.createController(id, controllerConstructor, services, scope, bindings);
        }
    }

    /**
     * Register a controller to be created when the custom elements are found. Note that your class is not a HTMLElement like a normal
     * web component class. Instead a web component is created that forwards the events to your class. Your class's constructor is called
     * after the component is fully formed with the dependencies injected from DI. This happens during the web component connectedCallback.
     * Before then nothing is created. This also alters the expected lifecycle. Normally you would expect 
     * constructed -> attributeChangedCallback -> connectedCallback for a new component, but now it will be constructor -> connectedCallback. The
     * component is not fully formed enough on the first attributeChangedCallback to respond usefully.
     * @param elementName
     * @param controllerConstructor
     * @param options
     */
    public registerWebComponent<T>(elementName: string, controllerConstructor: di.DiFunction<T>, options?: any): void {
        this.registerWebComponentId(undefined, elementName, controllerConstructor, options);
    }

    public registerWebComponentId<T, TId>(id: TId, elementName: string, controllerConstructor: di.DiFunction<T>, options?: ElementDefinitionOptions): void {
        //Stuff we need to pass into the class defined below.
        var self = this;

        class ControllerElement extends HTMLElement {
            private controller: any;

            connectedCallback() {
                console.log("Connected " + elementName);

                const services = new di.ServiceCollection();
                const scope = self.baseScope.createChildScope(services);
                const bindings = new BindingCollection(this);
                services.addTransient(BindingCollection, s => bindings);
                this.removeAttribute('data-hr-controller');
                this.controller = self.createController(id, controllerConstructor, services, scope, bindings);
                if (this.controller.connectedCallback) {
                    this.controller.connectedCallback();
                }
            }

            disconnectedCallback() {
                console.log("Disconnected " + elementName);
                if (this.controller.disconnectedCallback) {
                    this.controller.disconnectedCallback();
                }
            }

            adoptedCallback() {
                console.log("Adopted " + elementName);
                if (this.controller.adoptedCallback) {
                    this.controller.adoptedCallback();
                }
            }

            attributeChangedCallback() {
                console.log("Attribute changed " + elementName);
                if (this.controller.attributeChangedCallback) {
                    this.controller.attributeChangedCallback();
                }
            }
        }
        window.customElements.define(elementName, ControllerElement, options)
    }

    private createController(id: any, controllerConstructor: di.DiFunction<any>, services: di.ServiceCollection, scope: di.Scope, bindings: BindingCollection) {
        services.addTransient(InjectedControllerBuilder, s => new InjectedControllerBuilder(scope));
        const controller = scope.getRequiredServiceId(id, controllerConstructor);
        bindings.setListener(controller);
        if (controller.postBind !== undefined) {
            controller.postBind();
        }
        this.controllerCreatedEvent.fire(controller);
        return controller;
    }
}