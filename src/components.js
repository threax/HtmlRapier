"use strict";

//Components is a bit trickier, we want part of it to run right away
//First define the module
jsns.define("hr.components", [
    "hr.typeidentifiers",
    "hr.domquery"
],
function (exports, module, typeId, domquery) {
    var factory = {};

    /**
     * This callback is called when a component is created
     * @callback exports.createComponent~callback
     * @param {exports.component.BindingCollection} created
     * @param {object} data
     */

    /**
     * This callback is called when a component is about to be created and we want its variant.
     * @callback exports.createComponent~callback
     * @param {object} data - The data to identify a variant for.
     * @return {string} the name of the variant to use or null to use the original.
     */

    /**
     * This callback is used to create components when they are requested.
     * @callback exports.registerComponent~callback
     * @param {exports.component.BindingCollection} created
     * @param {object} data
     * @returns {exports.component.BindingCollection} 
     */

    /**
     * Register a function with the component system.
     * @param {string} name - The name of the component
     * @param {exports.registerComponent~callback} createFunc - The function that creates the new component.
     */
    function register(name, createFunc) {
        factory[name] = createFunc;
    }
    exports.register = register;

    /**
     * Get the default vaule if variant is undefined.
     * @returns variant default value (null)
     */
    function getDefaultVariant() {
        return null;
    }

    /**
     * Create a new component specified by name with the data in data attached to parentComponent. You can also
     * get a callback whenever a component is created by passing a createdCallback.
     * @param {string} name - The name of the component to create.
     * @param {object} data - The data to bind to the component.
     * @param {HTMLElement} parentComponent - The html element to attach the component to.
     * @param {exports.createComponent~callback} createdCallback - The callback called when the component is created.
     * @returns {exports.component.BindingCollection} 
     */
    function single(name, parentComponent, data, createdCallback, variant) {
        if (variant === undefined) {
            variant = getDefaultVariant();
        }
        return doCreateComponent(name, data, parentComponent, null, variant, createdCallback);
    }
    exports.single = single;

    /**
     * Create a component for each element in data using that element as the data for the component.
     * @param {string} name - The name of the component to create.
     * @param {HTMLElement} parentComponent - The html element to attach the component to.
     * @param {array|function} data - The data to repeat and bind, must be an array or function so it can be iterated.
     * If it is a function return the data and then return null to stop iteration.
     * @param {exports.createComponent~callback} createdCallback
     */
    function repeat(name, parentComponent, data, createdCallback, variantFinderCallback) {
        if (variantFinderCallback === undefined) {
            variantFinderCallback = getDefaultVariant;
        }
        //Look for an insertion point
        var insertBefore = null;
        var insertBefore = parentComponent.firstElementChild;
        var variant;
        while (insertBefore != null && !insertBefore.hasAttribute('data-hr-insert')) {
            insertBefore = insertBefore.nextElementSibling;
        }

        var fragmentParent = document.createDocumentFragment();

        //Output
        if (typeId.isArray(data)) {
            //An array, read it as fast as possible
            for (var i = 0; i < data.length; ++i) {
                variant = variantFinderCallback(data[i]);
                doCreateComponent(name, data[i], fragmentParent, null, variant, createdCallback);
            }
        }
        else if (typeId.isForEachable(data)) {
            //Data supports a 'foreach' method, use this to iterate it
            data.forEach(function (item) {
                variant = variantFinderCallback(item);
                doCreateComponent(name, item, fragmentParent, null, variant, createdCallback);
            })
        }
        else if (typeId.isFunction(data)) {
            var current = data();
            variant = variantFinderCallback(current);
            while (current != null) {
                doCreateComponent(name, current, fragmentParent, null, variant, createdCallback);
                current = data();
                variant = variantFinderCallback(current);
            }
        }

        parentComponent.insertBefore(fragmentParent, insertBefore);
    }
    exports.repeat = repeat;

    /**
     * Remove all children from an html element.
     * @param {HTMLElement} parentComponent - The component to remove all children from
     */
    function empty(parentComponent) {
        parentComponent = domquery.first(parentComponent);
        var currentNode = parentComponent.firstChild;
        var nextNode = null;

        //Walk the nodes and remove any non keepers
        while (currentNode != null) {
            nextNode = currentNode.nextSibling;
            if (currentNode.nodeType !== 1 || !currentNode.hasAttribute('data-hr-keep')) {
                parentComponent.removeChild(currentNode);
            }
            currentNode = nextNode;
        }
    }
    exports.empty = empty;

    function doCreateComponent(name, data, parentComponent, insertBeforeSibling, variant, createdCallback) {
        parentComponent = domquery.first(parentComponent);
        if (factory.hasOwnProperty(name)) {
            var created = factory[name](data, parentComponent, insertBeforeSibling, variant);
            if (createdCallback !== undefined && createdCallback !== null) {
                createdCallback(created, data);
            }
            return created;
        }
        else {
            console.log("Failed to create component '" + name + "', cannot find factory, did you forget to define it on the page?")
        }
    }
});