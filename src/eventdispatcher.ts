"use strict";

type ActionEventListener<T> = (arg:T) => void;
type FuncEventListener<TRet, TArg> = (arg:TArg) => TRet;

/**
 * A view of EventDispatcher that only allows add and remove.
 */
interface EventModifier<T>{
    add(listener: T): void;
    remove(listener: T): void;
}

/**
 * This class provides a reusable way to fire events to multiple listeners.
 * This base class provides a view of the object that does not include a fire
 * function.
 */
export class EventDispatcher<TListener> {
    protected listeners: TListener[] = <any>[];

    add(listener: TListener) {
        this.listeners.push(listener);
    }

    remove(listener: TListener) {
        for (var i = 0; i < this.listeners.length; ++i) {
            if (this.listeners[i] === listener) {
                this.listeners.splice(i--, 1);
            }
        }
    }

    get modifier(): EventModifier<TListener>{
        return this;
    }
}

/**
 * This event dispatcher does not handle event listeners returning values.
 */
export class ActionEventDispatcher<T> extends EventDispatcher<ActionEventListener<T>>{
    fire(arg:T){
        for (var i = 0; i < this.listeners.length; ++i) {
            this.listeners[i](arg);
        }
    }
}

/**
 * This is class is for events that return a value.
 */
export class FuncEventDispatcher<TRet, TArg> extends EventDispatcher<FuncEventListener<TRet, TArg>>{
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
export class PromiseEventDispatcher<TRet, TArg> extends EventDispatcher<FuncEventListener<Promise<TRet>, TArg>>{
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