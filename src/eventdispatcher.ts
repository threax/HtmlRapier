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
 * Track listeners and fire events. If an event handler throws an error the error
 * will be printed to the console, but all other listeners will still fire and the caller
 * will not know about the error. This is intended to make consuming events this handler
 * fires work like an event coming off an html element where the exception will be logged,
 * but the page itself does not break.
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
            try {
                this.listeners[i](arg);
            }
            catch (e) {
                console.error("An error occured firing an ActionEventDispatcher.");
                console.error(e);
            }
        }
    }
}

/**
 * This event dispatcher will return a promise that will resolve when all events
 * are finished running. Allows async work to stay in the event flow. This will handle
 * errors in the same way as the ActionEventDispatcher where they are printed, but not
 * bubbled up to the caller. Any results that do go through will be returned even if others
 * return errors.
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
    
    async fire(arg:TArg): Promise<TRet[]> {
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

        for (var i = 0; i < promises.length; ++i) {
            try {
                await promises[i];
            }
            catch (e) {
                console.error("An error occured firing a PromiseEventDispatcher.");
                console.error(e);
            }
        }

        return result;
    }
}