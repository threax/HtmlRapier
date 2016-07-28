"use strict";

jsns.define("htmlrest.eventhandler", null,
function (exports, module) {
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