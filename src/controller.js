"use strict";

jsns.define("htmlrest.controller", [
    "htmlrest.bindingcollection",
    "htmlrest.domquery"
],
function (exports, module, BindingCollection, domQuery) {
    /**
     * Create controller instances for all controllers named name using the given controllerConstructor function.
     * The created controllers will automatically be assigned as a listener to the bindings. This way the object
     * you create with your constructor funciton can define the main functions for the controller.
     * @param {type} name
     * @param {type} controllerConstructor
     */
    function create(name, controllerConstructor) {
        domQuery.iterate('[data-hr-controller="' + name + '"]', null, function (element) {
            var bindings = new BindingCollection(element);
            var controller = new controllerConstructor(bindings);
            bindings.setListener(controller);
            element.removeAttribute('data-hr-controller');
        });
    }

    exports.create = create;
});