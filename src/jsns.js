﻿"use strict";

var jsns = (function () {
    var loaded = {};
    var unloaded = {};
    var runners = [];

    function isModuleLoaded(name) {
        return loaded[name] !== undefined;
    }

    function isModuleLoadable(name) {
        return unloaded[name] !== undefined;
    }

    function loadModule(name){
        var loaded = checkLib(unloaded[name]);
        if (loaded) {
            delete unloaded[name];
        }
        return loaded;
    }

    function setModuleLoaded(name, module) {
        if (loaded[name] === undefined) {
            loaded[name] = module;
        }
    }

    function Module(name) {
        var loadingDelayed = false;
        var self = this;

        this.exports = {};

        /**
         * Figure out if this module is delay loading.
         * @returns {bool} True if delay loading, false if fully loaded
         */
        this.isLoadingDelayed = function(){
            return loadingDelayed;
        }

        /**
         * Set this module to delay loading mode, you must call setLoaded manually
         * after calling this function or the module will never be considered loaded.
         * Do this if you need additional async calls to fully load your module.
         */
        this.delayLoading = function () {
            loadingDelayed = true;
        }

        /**
         * Set the module to loaded. Only needs to be called if delayLoading is called,
         * otherwise there is no need.
         */
        this.loaded = function () {
            setModuleLoaded(name, self);
            loadRunners();
        }
    }

    function checkLib(library) {
        var dependencies = library.dependencies;
        var fullyLoaded = true;
        var module = undefined;

        //Check to see if depenedencies are loaded and if they aren't and can be, load them
        for (var i = 0; i < dependencies.length; ++i) {
            var dep = dependencies[i];
            dep.loaded = isModuleLoaded(dep.name);
            if (!dep.loaded && isModuleLoadable(dep.name)) {
                dep.loaded = loadModule(dep.name);
            }
            fullyLoaded = fullyLoaded && dep.loaded;
        }

        //If all dependencies are loaded, load this library
        if (fullyLoaded) {
            module = new Module(library.name);
            var args = [module.exports, module];

            //Inject dependency arguments
            for (var i = 0; i < dependencies.length; ++i) {
                var dep = dependencies[i];
                args.push(loaded[dep.name].exports);
            }

            library.factory.apply(module, args);

            if (!module.isLoadingDelayed()) {
                setModuleLoaded(library.name, module);
            }
        }

        return fullyLoaded && !module.isLoadingDelayed();
    }

    function Library(name, depNames, factory) {
        this.name = name;
        this.factory = factory;
        this.dependencies = [];

        if (depNames) {
            for (var i = 0; i < depNames.length; ++i) {
                var depName = depNames[i];
                this.dependencies.push({
                    name: depName,
                    loaded: isModuleLoaded(depName)
                });
            }
        }
    }

    function loadRunners() {
        for (var i = 0; i < runners.length; ++i) {
            var runner = runners[i];
            if (checkLib(runner)) {
                runners.splice(i--, 1);
            }
        }
    }

    function recursiveWaitingDebug(name, indent) {
        var indent = '';
        for (var i = 0; i < indent; ++i) {
            indent += ' ';
        }

        var module = unloaded[name];
        if (module !== undefined) {
            console.log(indent + module.name);
            for (var j = 0; j < module.dependencies.length; ++j) {
                var dependency = module.dependencies[j];
                if (!isModuleLoaded(dependency.name)) {
                    recursiveWaitingDebug(dependency.name, indent + 4);
                }
            }
        }
        else {
            console.log(indent + name + ' module not yet loaded.');
        }
    }

    return {
        run: function (dependencies, factory) {
            runners.push(new Library("AnonRunner", dependencies, factory));
            loadRunners();
        },

        define: function (name, dependencies, factory) {
            unloaded[name] = new Library(name, dependencies, factory);
            loadRunners();
        },

        debug: function () {
            if (runners.length > 0) {
                for (var i = 0; i < runners.length; ++i) {
                    var runner = runners[i];
                    console.log("Runner waiting " + runner.name);
                    for (var j = 0; j < runner.dependencies.length; ++j) {
                        var dependency = runner.dependencies[j];
                        if (!isModuleLoaded(dependency.name)) {
                            recursiveWaitingDebug(dependency.name, 0);
                        }
                    }
                }
            }
            else {
                console.log("No runners remaining.");
            }
        }
    }
})();