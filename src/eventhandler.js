"use strict";

jsns.define("htmlrest.eventhandler", null,
function (exports, module) {

    /**
     * This class provides a reusable way to fire events to multiple listeners.
     */
    function EventHandler() {
        var handlers = [];

        function add(context, handler) {
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

        function fire() {
            for (var i = 0; i < handlers.length; ++i) {
                var handlerObj = handlers[i];
                handlerObj.handler.apply(handlerObj.context, arguments);
            }
        }
        this.fire = fire;
    }

    module.exports = EventHandler;
});

jsns.define("htmlrest.lateboundeventhandler", [
    "htmlrest.eventhandler"
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
            currentFire.apply(this, arguments);
        }
        this.fire = fire;
    }

    module.exports = LateBoundEventHandler;
});