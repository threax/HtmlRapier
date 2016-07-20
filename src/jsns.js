"use strict";

/**
 * This class tries to emulate namespaces and using statements. It assumes that all
 * dependency files are already loaded, this just discoveres functionality and 
 * prevents polluting the global namespace.
 */
var jsns = (function () {
    var modules = {};
    var factories = {};

    function using(name) {
        var exports = modules[name];

        //Not loaded yet, load it
        if (exports === undefined) {
            var factory = factories[name];
            if (factory !== undefined) {
                modules[name] = exports = factory(using);
            }
            else {
                throw 'Cannot import namespace named "' + name + '". Not Found.';
            }
        }

        return exports;
    }

    return {
        run: function (context) {
            context(using);
        },

        define: function (name, factory) {
            factories[name] = factory;
        }
    }
})();