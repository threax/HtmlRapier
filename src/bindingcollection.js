"use strict";

/**
 * @callback hr_bindingcollection_eventcallback
 */

/**
 * @callback hr_iter
 * @param {array} items - the items to iterate
 * @param {hr_iter_cb} - the function to transform each object
 * @returns the transformed item and null when all items are iterated
 */

/**
 * @typedef {object} hr_bindingcollection
 */

jsns.define("hr.bindingcollection", [
    "hr.escape",
    "hr.typeidentifiers",
    "hr.domquery",
    "hr.textstream",
    "hr.toggles",
    "hr.models"
],
function (exports, module, escape, typeId, domQuery, TextStream, toggles, models) {
    function EventRunner(name, listener) {
        this.execute = function (evt) {
            var cb = listener[name];
            if (cb) {
                cb.call(this, evt);
            }
        }
    }

    function bindEvents(elements, listener) {
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            domQuery.iterateNodes(element, NodeFilter.SHOW_ELEMENT, function (node) {
                //Look for attribute
                for (var i = 0; i < node.attributes.length; i++) {
                    var attribute = node.attributes[i];
                    if (attribute.name.startsWith('data-hr-on-')) {
                        var eventFunc = attribute.value;
                        if (listener[eventFunc]) {
                            var runner = new EventRunner(eventFunc, listener);
                            node.addEventListener(attribute.name.substr(11), runner.execute);
                        }
                    }
                }
            });
        }
    }

    function getToggle(name, elements, states, toggleCollection) {
        var toggle = toggleCollection[name];
        if (toggle === undefined) {
            var query = '[data-hr-toggle=' + name + ']';
            for (var eIx = 0; eIx < elements.length; ++eIx) {
                var element = elements[eIx];
                var toggleElement = domQuery.first(query, element);
                if (toggleElement) {
                    toggle = toggles.build(toggleElement, states);
                    toggleCollection[name] = toggle;
                    return toggle; //Found it, need to break element loop, done here if found
                }
                else {
                    toggle = null;
                }
            }
        }

        if (toggle === null) {
            toggle = toggles.build(null, states);
        }

        return toggle;
    }

    function getModel(name, elements, modelCollection) {
        var model = modelCollection[name];
        if (model === undefined) {
            var query = '[data-hr-model=' + name + ']';
            for (var eIx = 0; eIx < elements.length; ++eIx) {
                var element = elements[eIx];
                var targetElement = domQuery.first(query, element);
                if (targetElement) {
                    model = models.build(targetElement);
                    modelCollection[name] = model;
                    return model; //Found it, need to break element loop, done here if found
                }
                else {
                    model = null;
                }
            }
        }

        if (model === null) {
            model = new models.NullModel();
        }

        return model;
    }

    function getConfig(elements) {
        var data = {};
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            domQuery.iterateNodes(element, NodeFilter.SHOW_ELEMENT, function (node) {
                //Look for attribute
                for (var i = 0; i < node.attributes.length; i++) {
                    var attribute = node.attributes[i];
                    if (attribute.name.startsWith('data-hr-config-')) {
                        data[attribute.name.substr(15)] = attribute.value;
                    }
                }
            });
        }
        return data;
    }

    function iterateControllers(name, elements, cb) {
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            domQuery.iterate('[data-hr-controller="' + name + '"]', element, function (cntrlElement) {
                cb(cntrlElement);
            });
        }
    }

    /**
     * 
     * @param {HtmlElement} elements
     */
    function BindingCollection(elements) {
        elements = domQuery.all(elements);
        var dataTextElements = undefined;
        var toggleCollection = undefined;
        var modelCollection = undefined;

        /**
         * Set the listener for this binding collection. This listener will have its functions
         * fired when a matching event is fired.
         * @param {type} listener
         */
        this.setListener = function (listener) {
            bindEvents(elements, listener);
        }

        /**
         * Set the data for this binding collection. Will run a format text on all text nodes
         * inside the collection. These nodes must have variables in them.
         * @param {type} data
         */
        this.setData = function (data) {
            dataTextElements = bindData(data, elements, dataTextElements);
        }

        this.getToggle = function (name, states) {
            if (toggleCollection === undefined) {
                toggleCollection = {};
            }
            return getToggle(name, elements, states, toggleCollection);
        }

        this.getModel = function (name) {
            if (modelCollection === undefined) {
                modelCollection = {};
            }
            return getModel(name, elements, modelCollection);
        }

        this.getConfig = function () {
            return getConfig(elements);
        }

        this.iterateControllers = function (name, cb) {
            iterateControllers(name, elements, cb);
        }
    };

    module.exports = BindingCollection;
});