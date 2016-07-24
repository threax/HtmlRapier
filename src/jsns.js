"use strict";

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
        return unloaded[name].check();
        delete unloaded[name];
    }

    function Module() {
        this.exports = {};
    }

    function Unloaded(name, depFinder, factory) {
        var dependencies = [];

        function tryUsing(name) {
            var dep = {
                name: name,
                loaded: isModuleLoaded(name)
            };
            dependencies.push(dep);
        }
        depFinder(tryUsing);

        function check() {
            var fullyLoaded = true;

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
                var module = new Module();
                if (name) {
                    loaded[name] = module;
                }
                var args = [module.exports, module];

                //Inject dependency arguments
                for (var i = 0; i < dependencies.length; ++i) {
                    var dep = dependencies[i];
                    args.push(loaded[dep.name].exports);
                }

                factory.apply(module, args);
            }

            return fullyLoaded;
        }
        this.check = check;
    }

    function loadRunners() {
        for (var i = 0; i < runners.length; ++i) {
            var runner = runners[i];
            if (runner.check()) {
                runners.splice(i--, 1);
            }
        }
    }

    return {
        run: function (dependencies, factory) {
            runners.push(new Unloaded(null, dependencies, factory));
            loadRunners();
        },

        define: function (name, dependencies, factory) {
            unloaded[name] = new Unloaded(name, dependencies, factory);
            loadRunners();
        }
    }
})();