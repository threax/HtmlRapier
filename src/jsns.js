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
        var module = modules[name];

        //Not loaded yet, load it
        if (module === undefined) {
            var factory = factories[name];
            if (factory !== undefined) {
                modules[name] = module = { exports: {} };
                factory(using, module.exports, module);
            }
            else {
                throw 'Cannot import namespace named "' + name + '". Not Found.';
            }
        }

        return module.exports;
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