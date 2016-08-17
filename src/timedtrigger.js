"use strict";

jsns.define("htmlrest.timedtrigger", [
    "htmlrest.eventhandler"
],
function (exports, module, EventHandler) {
    function TimedTrigger(delay) {
        if (delay === undefined) {
            delay = 400;
        }
        
        var _delay = delay;
        var holder;
        var handler = new EventHandler();
        var args;
        
        this.handler = handler.modifier;

        function setDelay(delay) {
            _delay = delay;
        }
        this.setDelay = setDelay;

        function stop() {
            clearTimeout(holder);
            args = undefined;
        }
        this.stop = stop;

        function fire() {
            stop();
            holder = window.setTimeout(fireHandler, _delay);
            args = arguments;
        }
        this.fire = fire;

        function addListener(context, listener) {
            handler.modifier.add(context, listener);
        }
        this.addListener = addListener;

        function removeListener(context, listener) {
            handler.modifier.remove(context, listener);
        }
        this.removeListener = removeListener;

        function fireHandler() {
            handler.fire.apply(handler, args);
        }

    }

    module.exports = TimedTrigger;
});