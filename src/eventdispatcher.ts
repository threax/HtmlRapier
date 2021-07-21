"use strict";

import * as typeId from './typeidentifiers';

export type ActionEventListener<T> = (arg:T) => void;
export type FuncEventListener<TRet, TArg> = (arg:TArg) => TRet;

/**
 * A view of EventDispatcher that only allows add and remove.
 */
export interface EventModifier<T>{
    add(listener: T): void;
    remove(listener: T): void;
}

/**
 * This event dispatcher does not handle event listeners returning values.
 */
export class ActionEventDispatcher<T>{
    protected listeners: ActionEventListener<T>[] = <any>[];

    add(listener: ActionEventListener<T>) {
        if(!typeId.isFunction(listener)){
            throw new Error("Listener must be a function, instead got " + typeof(listener));
        }
        this.listeners.push(listener);
    }

    remove(listener: ActionEventListener<T>) {
        for (var i = 0; i < this.listeners.length; ++i) {
            if (this.listeners[i] === listener) {
                this.listeners.splice(i--, 1);
            }
        }
    }

    get modifier(): EventModifier<ActionEventListener<T>>{
        return this;
    }

    fire(arg:T){
        for (var i = 0; i < this.listeners.length; ++i) {
            this.listeners[i](arg);
        }
    }
}

/**
 * This is class is for events that return a value.
 */
export class FuncEventDispatcher<TRet, TArg>{
    protected listeners: FuncEventListener<TRet, TArg>[] = <any>[];

    add(listener: FuncEventListener<TRet, TArg>) {
        if(!typeId.isFunction(listener)){
            throw new Error("Listener must be a function, instead got " + typeof(listener));
        }
        this.listeners.push(listener);
    }

    remove(listener: FuncEventListener<TRet, TArg>) {
        for (var i = 0; i < this.listeners.length; ++i) {
            if (this.listeners[i] === listener) {
                this.listeners.splice(i--, 1);
            }
        }
    }

    get modifier(): EventModifier<FuncEventListener<TRet, TArg>>{
        return this;
    }

    fire(arg:TArg){
        var result : TRet[] = undefined;
        var nextResult : TRet;
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = this.listeners[i];
            nextResult = listener(arg);
            if (nextResult !== undefined) {
                if (result === undefined) {
                    result = [];
                }
                result.push(nextResult);
            }
        }
        return result;
    }
}

/**
 * This event dispatcher will return a promise that will resolve when all events
 * are finished running. Allows async work to stay in the event flow.
 */
export class PromiseEventDispatcher<TRet, TArg>{
    protected listeners: FuncEventListener<Promise<TRet>, TArg>[] = <any>[];

    add(listener: FuncEventListener<Promise<TRet>, TArg>) {
        if(!typeId.isFunction(listener)){
            throw new Error("Listener must be a function, instead got " + typeof(listener));
        }
        this.listeners.push(listener);
    }

    remove(listener: FuncEventListener<Promise<TRet>, TArg>) {
        for (var i = 0; i < this.listeners.length; ++i) {
            if (this.listeners[i] === listener) {
                this.listeners.splice(i--, 1);
            }
        }
    }

    get modifier(): EventModifier<FuncEventListener<Promise<TRet>, TArg>>{
        return this;
    }
    
    /**
     * Fire the event. The listeners can return values, if they do the values will be added
     * to an array that is returned by the promise returned by this function.
     * @returns {Promise} a promise that will resolve when all fired events resolve.
     */
    fire(arg:TArg): Promise<TRet[]> {
        var result: TRet[];
        var promises:Promise<void>[] = [];
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = this.listeners[i];
            promises.push(new Promise<TRet>(function (resovle, reject) {
                resovle(listener(arg));
            })
            .then(function (data) {
                if (data !== undefined) {
                    if (result === undefined) {
                        result = [];
                    }
                    result.push(data);
                }
            }));
        }

        return Promise.all(promises)
            .then(function (data) {
                return result;
            });
    }
}