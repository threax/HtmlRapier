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
        var loaded = checkLib(unloaded[name]);
        if (loaded) {
            delete unloaded[name];
        }
        return loaded;
    }

    function Module() {
        this.exports = {};
    }

    function checkLib(library) {
        var dependencies = library.dependencies;
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
            if (library.name) {
                loaded[library.name] = module;
            }
            var args = [module.exports, module];

            //Inject dependency arguments
            for (var i = 0; i < dependencies.length; ++i) {
                var dep = dependencies[i];
                args.push(loaded[dep.name].exports);
            }

            library.factory.apply(module, args);
        }

        return fullyLoaded;
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

    return {
        run: function (dependencies, factory) {
            runners.push(new Library(null, dependencies, factory));
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
                    console.log("Runner waiting " + runner);
                    for (var j = 0; j < runner.dependencies.length; ++j) {
                        var dependency = runner.dependencies[j];
                        if (!isModuleLoaded(dependency.name)) {
                            console.log("  dependency " + dependency.name);
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