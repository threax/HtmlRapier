"use strict";

//Components is a bit trickier, we want part of it to run right away
//First define the module
jsns.define("htmlrest.components", function (using) {
    var factory = {};
    var typeId = using("htmlrest.typeidentifiers");
    var domquery = using("htmlrest.componentresolver");
    var exports = {};

    /**
     * This callback is called when a component is created
     * @callback exports.createComponent~callback
     * @param {exports.component.BindingCollection} created
     * @param {object} data
     */

    /**
     * Create a new component specified by name with the data in data attached to parentComponent. You can also
     * get a callback whenever a component is created by passing a createdCallback.
     * @param {string} name - The name of the component to create. These are specified on the page with a data-htmlrest-component
     * attribute or can be manually specified.
     * @param {object} data - The data to bind to the component.
     * @param {HTMLElement} parentComponent - The html element to attach the component to.
     * @param {exports.createComponent~callback} createdCallback - The callback called when the component is created.
     * @param {HTMLElement} insertBeforeSibling - The sibling to insert the new component before.
     * @returns {exports.component.BindingCollection} 
     */
    exports.single = function (name, data, parentComponent, createdCallback) {
        return doCreateComponent(name, data, parentComponent, null, createdCallback);
    }

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
    exports.register = function (name, createFunc) {
        factory[name] = createFunc;
    }

    /**
     * Create a component for each element in data using that element as the data for the component.
     * @param {string} name - The name of the component to create. These are specified on the page with a data-htmlrest-component
     * @param {HTMLElement} parentComponent - The html element to attach the component to.
     * @param {array|object|function} data - The data to repeat and bind, must be an array, object or function so it can be iterated.
     * If it is a function return the data and then return null to stop iteration.
     * @param {exports.createComponent~callback} createdCallback
     */
    exports.repeat = function (name, parentComponent, data, createdCallback) {
        //Look for an insertion point
        var insertBefore = null;
        var insertBefore = parentComponent.firstElementChild;
        while (insertBefore != null && !insertBefore.hasAttribute('data-htmlrest-insert')) {
            insertBefore = insertBefore.nextElementSibling;
        }

        //Output
        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; ++i) {
                doCreateComponent(name, data[i], parentComponent, insertBefore, createdCallback);
            }
        }
        else if (typeId.isFunction(data)) {
            var current = data();
            while (current != null) {
                doCreateComponent(name, current, parentComponent, insertBefore, createdCallback);
                current = data();
            }
        }
        else if (typeId.isObject(data)) {
            for (var key in data) {
                doCreateComponent(name, data[key], parentComponent, insertBefore, createdCallback);
            }
        }
    };

    /**
     * Remove all children from an html element.
     * @param {HTMLElement} parentComponent - The component to remove all children from
     */
    exports.empty = function (parentComponent) {
        parentComponent = domquery.first(parentComponent);
        var currentNode = parentComponent.firstChild;
        var nextNode = null;

        //Walk the nodes and remove any non keepers
        while (currentNode != null) {
            nextNode = currentNode.nextSibling;
            if (currentNode.nodeType !== 1 || !currentNode.hasAttribute('data-htmlrest-keep')) {
                parentComponent.removeChild(currentNode);
            }
            currentNode = nextNode;
        }
    };

    function doCreateComponent(name, data, parentComponent, insertBeforeSibling, createdCallback) {
        parentComponent = domquery.first(parentComponent);
        if (factory.hasOwnProperty(name)) {
            var created = factory[name](data, parentComponent, insertBeforeSibling);
            if (createdCallback !== undefined) {
                createdCallback(created, data);
            }
            return created;
        }
    }

    return exports;
});