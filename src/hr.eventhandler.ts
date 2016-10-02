"use strict";

/**
 * This class provides a reusable way to fire events to multiple listeners.
 */
export class EventHandler {
    private handlers = [];

    add(context, handler) {
        if (context === undefined) {
            throw "context cannot be undefined";
        }
        if (handler === undefined) {
            throw "handler cannot be undefined";
        }
        this.handlers.push({
            handler: handler,
            context: context
        });
    }

    remove(context, handler) {
        for (var i = 0; i < this.handlers.length; ++i) {
            if (this.handlers[i].handler === handler && this.handlers[i].context === context) {
                this.handlers.splice(i--, 1);
            }
        }
    }

    modifier = {
        add: (context, handler) => {
            this.add(context, handler);
        },
        remove: (context, handler) => {
            this.remove(context, handler);
        }
    };

    /**
     * Fire the event. The listeners can return values, if they do the values will be added
     * to an array that is returned by this fuction.
     * @returns {array|undefined} an array of all the values returned by the listeners or undefiend if
     * no values are returned.
     */
    fire(...args:any[]) {
        var result;
        var nextResult;
        for (var i = 0; i < this.handlers.length; ++i) {
            var handlerObj = this.handlers[i];
            nextResult = handlerObj.handler.apply(handlerObj.context, args);
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