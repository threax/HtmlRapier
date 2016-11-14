"use strict";

/**
 * This class provides a reusable way to fire events to multiple listeners.
 * This base class provides a view of the object that does not include a fire
 * function. This makes it easier to make an event accessible to listeners without
 * having to worry about them firing it.
 */
export class EventModifier<TListener> {
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
}

/**
 * This is the base class for a simple event dispatcher that does not handle event listeners returning values.
 */
class EventDispatcherBase<TListener> extends EventModifier<TListener>{
    doFire(...args:any[]){
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = <any>this.listeners[i];
            listener.apply(this, args);
        }
    }
}

/**
 * An event dispatcher that takes no args for its fire event.
 */
export class EventDispatcher extends EventDispatcherBase<Action>{
    /**
     * Fire the event.
     */
    fire(): void {
        this.doFire();
    }
}

/**
 * An event dispatcher that takes 1 arg for its fire event.
 */
export class EventDispatcher1<T1> extends EventDispatcherBase<Action1<T1>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1): void {
        this.doFire(arg1);
    }
}

/**
 * An event dispatcher that takes 2 args for its fire event.
 */
export class EventDispatcher2<T1, T2> extends EventDispatcherBase<Action2<T1, T2>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2): void {
        this.doFire(arg1, arg2);
    }
}

/**
 * An event dispatcher that takes 3 args for its fire event.
 */
export class EventDispatcher3<T1, T2, T3> extends EventDispatcherBase<Action3<T1, T2, T3>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3): void {
        this.doFire(arg1, arg2, arg3);
    }
}

/**
 * An event dispatcher that takes 4 args for its fire event.
 */
export class EventDispatcher4<T1, T2, T3, T4> extends EventDispatcherBase<Action4<T1, T2, T3, T4>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3, arg4: T4): void {
        this.doFire(arg1, arg2, arg3, arg4);
    }
}

/**
 * An event dispatcher that takes 5 args for its fire event.
 */
export class EventDispatcher5<T1, T2, T3, T4, T5> extends EventDispatcherBase<Action5<T1, T2, T3, T4, T5>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): void {
        this.doFire(arg1, arg2, arg3, arg4, arg5);
    }
}

/**
 * This is the base class for events that return a value.
 */
class ReturningEventDispatcherBase<TResult, TListener> extends EventModifier<TListener>{
    doFire(...args:any[]){
        var result : TResult[] = undefined;
        var nextResult : TResult;
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = <any>this.listeners[i];
            nextResult = listener.apply(this, args);
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
 * An event dispatcher that takes no args for its fire event and returns a value from those events.
 */
export class ReturningEventDispatcher<TResult> extends ReturningEventDispatcherBase<TResult, Func<TResult>>{
    /**
     * Fire the event.
     */
    fire(): TResult[]|undefined {
        return this.doFire();
    }
}

/**
 * An event dispatcher that takes 1 arg for its fire event and returns a value from those events.
 */
export class ReturningEventDispatcher1<TResult, T1> extends ReturningEventDispatcherBase<TResult, Func1<TResult, T1>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1): TResult[]|undefined {
        return this.doFire(arg1);
    }
}

/**
 * An event dispatcher that takes 2 args for its fire event and returns a value from those events.
 */
export class ReturningEventDispatcher2<TResult, T1, T2> extends ReturningEventDispatcherBase<TResult, Func2<TResult, T1, T2>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2): TResult[]|undefined {
        return this.doFire(arg1, arg2);
    }
}

/**
 * An event dispatcher that takes 3 args for its fire event and returns a value from those events.
 */
export class ReturningEventDispatcher3<TResult, T1, T2, T3> extends ReturningEventDispatcherBase<TResult, Func3<TResult, T1, T2, T3>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3): TResult[]|undefined {
        return this.doFire(arg1, arg2, arg3);
    }
}

/**
 * An event dispatcher that takes 4 args for its fire event and returns a value from those events.
 */
export class ReturningEventDispatcher4<TResult, T1, T2, T3, T4> extends ReturningEventDispatcherBase<TResult, Func4<TResult, T1, T2, T3, T4>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3, arg4: T4): TResult[]|undefined {
        return this.doFire(arg1, arg2, arg3, arg4);
    }
}

/**
 * An event dispatcher that takes 5 args for its fire event and returns a value from those events.
 */
export class ReturningEventDispatcher5<TResult, T1, T2, T3, T4, T5> extends ReturningEventDispatcherBase<TResult, Func5<TResult, T1, T2, T3, T4, T5>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): TResult[]|undefined {
        return this.doFire(arg1, arg2, arg3, arg4, arg5);
    }
}

export class PromiseEventDispatcherBase<TResult, TListener> extends EventModifier<TListener>{
/**
     * Fire the event. The listeners can return values, if they do the values will be added
     * to an array that is returned by the promise returned by this function.
     * @returns {Promise} a promise that will resolve when all fired events resolve.
     */
    doFire(...args:any[]): Promise<TResult[]> {
        var result: TResult[];
        var promises:Promise<void>[] = [];
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = <any>this.listeners[i];
            promises.push(new Promise<TResult>(function (resovle, reject) {
                resovle(listener.apply(this, args));
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

/**
 * An event dispatcher that takes no args for its fire event and returns a value from those events.
 */
export class PromiseEventDispatcher<TResult> extends PromiseEventDispatcherBase<TResult, Func<Promise<TResult[]>>>{
    /**
     * Fire the event.
     */
    fire(): Promise<TResult[]> {
        return this.doFire();
    }
}

/**
 * An event dispatcher that takes 1 arg for its fire event and returns a 
 * promise to get values from the result of those events.
 */
export class PromiseEventDispatcher1<TResult, T1> extends PromiseEventDispatcherBase<TResult, Func1<Promise<TResult[]>, T1>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1): Promise<TResult[]> {
        return this.doFire(arg1);
    }
}

/**
 * An event dispatcher that takes 2 args for its fire event and returns a 
 * promise to get values from the result of those events.
 */
export class PromiseEventDispatcher2<TResult, T1, T2> extends PromiseEventDispatcherBase<TResult, Func2<Promise<TResult[]>, T1, T2>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2): Promise<TResult[]> {
        return this.doFire(arg1, arg2);
    }
}

/**
 * An event dispatcher that takes 3 args for its fire event and returns a 
 * promise to get values from the result of those events.
 */
export class PromiseEventDispatcher3<TResult, T1, T2, T3> extends PromiseEventDispatcherBase<TResult, Func3<Promise<TResult[]>, T1, T2, T3>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3): Promise<TResult[]> {
        return this.doFire(arg1, arg2, arg3);
    }
}

/**
 * An event dispatcher that takes 4 args for its fire event and returns a 
 * promise to get values from the result of those events.
 */
export class PromiseEventDispatcher4<TResult, T1, T2, T3, T4> extends PromiseEventDispatcherBase<TResult, Func4<Promise<TResult[]>, T1, T2, T3, T4>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3, arg4: T4): Promise<TResult[]> {
        return this.doFire(arg1, arg2, arg3, arg4);
    }
}

/**
 * An event dispatcher that takes 5 args for its fire event and returns a 
 * promise to get values from the result of those events.
 */
export class PromiseEventDispatcher5<TResult, T1, T2, T3, T4, T5> extends PromiseEventDispatcherBase<TResult, Func5<Promise<TResult[]>, T1, T2, T3, T4, T5>>{
    /**
     * Fire the event.
     */
    fire(arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): Promise<TResult[]> {
        return this.doFire(arg1, arg2, arg3, arg4, arg5);
    }
}