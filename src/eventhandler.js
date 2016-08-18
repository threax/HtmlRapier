"use strict";

jsns.define("hr.eventhandler", null,
function (exports, module) {

    /**
     * This class provides a reusable way to fire events to multiple listeners.
     */
    function EventHandler() {
        var handlers = [];

        function add(context, handler) {
            if (context === undefined) {
                throw "context cannot be undefined";
            }
            if (handler === undefined) {
                throw "handler cannot be undefined";
            }
            handlers.push({
                handler: handler,
                context: context
            });
        }

        function remove(context, handler) {
            for (var i = 0; i < handlers.length; ++i) {
                if (handlers[i].handler === handler && handlers[i].context === context) {
                    handlers.splice(i--, 1);
                }
            }
        }

        this.modifier = {
            add: add,
            remove: remove
        }

        /**
         * Fire the event. The listeners can return values, if they do the values will be added
         * to an array that is returned by this fuction.
         * @returns {array|undefined} an array of all the values returned by the listeners or undefiend if
         * no values are returned.
         */
        function fire() {
            var result;
            var nextResult;
            for (var i = 0; i < handlers.length; ++i) {
                var handlerObj = handlers[i];
                nextResult = handlerObj.handler.apply(handlerObj.context, arguments);
                if (nextResult !== undefined) {
                    if (result === undefined) {
                        result = [];
                    }
                    result.push(nextResult);
                }
            }
            return result;
        }
        this.fire = fire;
    }

    module.exports = EventHandler;
});

jsns.define("hr.lateboundeventhandler", [
    "hr.eventhandler"
],
function (exports, module, HrEventHandler) {

    /**
     * This class will queue up the events that fire through it until
     * an event handler is added, at that point it will function as a normal
     * event handler. Only the first bound event gets the queued events.
     */
    function LateBoundEventHandler() {
        var eventHandler = new HrEventHandler();
        var queuedEvents = [];
        var currentFire = queuedFire;

        function add(context, handler) {
            eventHandler.modifier.add(context, handler);
            if (queuedEvents !== null) {
                currentFire = eventFire;
                for (var i = 0; i < queuedEvents.length; ++i) {
                    fire.apply(this, queuedEvents[i]);
                }
                queuedEvents = null;
            }
        }

        function remove(context, handler) {
            eventHandler.modifier.remove(context, handler);
        }

        this.modifier = {
            add: add,
            remove: remove
        }

        function queuedFire() {
            queuedEvents.push(arguments);
        }

        function eventFire() {
            eventHandler.fire.apply(eventHandler, arguments);
        }

        function fire() {
            return currentFire.apply(this, arguments);
        }
        this.fire = fire;
    }

    module.exports = LateBoundEventHandler;
});

jsns.define("hr.promiseeventhandler", null,
function (exports, module) {

    /**
     * This class provides a reusable way to fire events to multiple listeners and wait for them using
     * promises.
     */
    function PromiseEventHandler() {
        var handlers = [];

        function add(context, handler) {
            if (context === undefined) {
                throw "context cannot be undefined";
            }
            if (handler === undefined) {
                throw "handler cannot be undefined";
            }
            handlers.push({
                handler: handler,
                context: context
            });
        }

        function remove(context, handler) {
            for (var i = 0; i < handlers.length; ++i) {
                if (handlers[i].handler === handler && handlers[i].context === context) {
                    handlers.splice(i--, 1);
                }
            }
        }

        this.modifier = {
            add: add,
            remove: remove
        }

        /**
         * Fire the event. The listeners can return values, if they do the values will be added
         * to an array that is returned by the promise returned by this function.
         * @returns {Promise} a promise that will resolve when all fired events resolve.
         */
        function fire() {
            var result;
            var promises = [];
            for (var i = 0; i < handlers.length; ++i) {
                var handlerObj = handlers[i];
                promises.push(new Promise(function(resovle, reject){
                    resovle(handlerObj.handler.apply(handlerObj.context, arguments));
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
        this.fire = fire;
    }

    module.exports = PromiseEventHandler;
});