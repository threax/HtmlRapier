﻿"use strict";

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

    function getToggle(name, elements, states) {
        var toggle;
        var query = '[data-hr-toggle=' + name + ']';
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            var toggleElement = domQuery.first(query, element);
            if (toggleElement) {
                toggle = toggles.build(toggleElement, states);
                return toggle; //Found it, need to break element loop, done here if found
            }
            else {
                toggle = null;
            }
        }

        if (toggle === null) {
            toggle = toggles.build(null, states);
        }

        return toggle;
    }

    function getModel(name, elements) {
        var model;
        var query = '[data-hr-model=' + name + ']';
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            var targetElement = domQuery.first(query, element);
            if (targetElement) {
                model = models.build(targetElement);
                return model; //Found it, need to break element loop, done here if found
            }
            else {
                model = null;
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

        /**
         * Set the listener for this binding collection. This listener will have its functions
         * fired when a matching event is fired.
         * @param {type} listener
         */
        this.setListener = function (listener) {
            bindEvents(elements, listener);
        }

        this.getToggle = function (name, states) {
            return getToggle(name, elements, states);
        }

        this.getModel = function (name) {
            return getModel(name, elements);
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