"use strict";

jsns.define("htmlrest.events", function (using) {},
function(exports, module){
    var events = {};

    /**
     * Register an event to fire under a certain name.
     * @param {string} name - The name of the event to register under.
     * @param {type} func - The function to call when the event is fired.
     */
    function register(name, func) {
        if (!events.hasOwnProperty(name)) {
            events[name] = [];
        }
        events[name].push(func);
    }
    exports.register = register;

    /**
     * Unregister func from name.
     * @param {string} name - The name of the event to unregister.
     * @param {type} func - The previously registered function to remove.
     */
    function unregister(name, func) {
        if (events.hasOwnProperty(name)) {
            var funcs = events[name];
            for (var i = 0; i < funcs.length; ++i) {
                if (funcs[i] === func) {
                    funcs.splice(i, 1);
                }
            }
        }
    }
    exports.unregister = unregister;

    /**
     * Fire the event to all registred functions under name. Optionally can pass a sender and arguments.
     * @param {type} name - The name of the event to fire.
     * @param sender
     * @param args
     */
    function fire(name, sender, args) {
        if (events.hasOwnProperty(name)) {
            var funcs = events[name];
            for (var i = 0; i < funcs.length; ++i) {
                funcs[i](sender, args);
            }
        }
    }
    exports.fire = fire;
});