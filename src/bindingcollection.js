"use strict";

jsns.define("htmlrest.bindingcollection", function (using) {
    var escape = using("htmlrest.escape");
    var typeId = using("htmlrest.typeidentifiers");
    var domQuery = using("htmlrest.domquery");

    //Startswith polyfill
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.substr(position, searchString.length) === searchString;
        };
    }

    function EventRunner(name, listener) {
        this.execute = function(evt){
            var cb = listener[name];
            if(cb){
                cb.call(this, evt);
            }
        }
    }

    function bindEvents(elements, listener) {
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            var iter = document.createNodeIterator(element, NodeFilter.SHOW_ELEMENT, function (node) {
                //Look for attribute
                for (var i = 0; i < node.attributes.length; i++) {
                    var attribute = node.attributes[i];
                    if (attribute.name.startsWith('data-hr-on-')) {
                        var runner = new EventRunner(attribute.value, listener);
                        node.addEventListener(attribute.name.substr(11), runner.execute);
                    }
                }
            }, false);
            while(iter.nextNode()){} //Have to walk to get results
        }
    }

    function bindNodes(bindings, elements) {
        for (var key in bindings) {
            var query = '[data-htmlrest-binding=' + key + ']';
            for (var eIx = 0; eIx < elements.length; ++eIx) {
                var element = elements[eIx];
                var child = domQuery.first(query, element);
                if (child) {
                    var elementBindings = bindings[key];
                    for (var name in elementBindings) {
                        child.addEventListener(name, elementBindings[name]);
                    }
                }
            }
        }
    }

    function bindData(data, elements) {
        for (var key in data) {
            var query = '[data-htmlrest-binding=' + key + ']';
            for (var eIx = 0; eIx < elements.length; ++eIx) {
                var element = elements[eIx];
                var child = domQuery.first(query, element);
                if (child) {
                    child.innerHTML = escape(data[key]);
                }
            }
        }
    }

    function lookupNodeInArray(bindingName, elements) {
        var query = '[data-htmlrest-binding=' + bindingName + ']';
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            var child = domQuery.first(query, element);
            if (child) {
                return child;
            }
            else {
                return null;
            }
        }
    }

    function iterateNodeArray(bindingName, elements, callback) {
        var query = '[data-htmlrest-binding=' + bindingName + ']';
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];

            var matchingChildren = domQuery.all(query, element);
            for (var i = 0; i < matchingChildren.length; ++i) {
                callback(matchingChildren[i]);
            }
        }
    }

    function getAllElements(bindingName, elements) {
        var results = [];
        var query = '[data-htmlrest-binding=' + bindingName + ']';
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            domQuery.all(query, element, results);
        }
        return results;
    }

    function OutputBindings(elements) {
        function TextNodeBinding(element, stream) {
            this.output = function (data) {
                element.innerText
            }
        }

        var textNodeBindings = [];
        for (var i = 0; i < elements.length; ++i) {
            var element = elements[i];
            var current = element.firstChild;
            while (current != null) {

            }
        }
    }

    //Constructor
    return function (elements) {
        elements = domQuery.all(elements);

        /**
         * Find the first binding that matches bindingName
         * @param {string} bindingName - The name of the binding to look up.
         * @returns {HTMLElement} - The found element
         */
        this.first = function (bindingName) {
            return lookupNodeInArray(bindingName, elements);
        }

        /**
         * Get the binding that matches input if it is a string.
         * Otherwise just returns input, ideally because you put an htmlelement in there already
         * @param {string|HTMLElement} input
         * @returns {HTMLElement} 
         */
        this.firstOrInput = function (input) {
            if (typeId.isString(input)) {
                return lookupNodeInArray(input, elements);
            }
            return input;
        }

        /**
         * Get all bindings that match the given binding name.
         * @param {string} bindingName - the name of the bindings to look up
         * @returns {array} - The array of bindings that match name
         */
        this.all = function (bindingName) {
            return getAllElements(bindingName, elements);
        }

        /**
         * Call callback for each item that matches bindingName
         * @param {type} bindingName - The name of the binding to look up.
         * @param {type} callback - The callback to call for each discovered binding
         */
        this.iterate = function (bindingName, callback) {
            iterateNodeArray(bindingName, elements, callback);
        }

        /**
         * Bind events to items in an element. elements is an array of elements to bind to.
         * This is the same format they are returned from the create functions with.
         * The bindings should be in the following form
         * name is the data-htmlrest-binding name of the element
         * eventNameX is the name of the event you want to bind to (click, submit etc)
         * {
         * name:{
         * eventName: function(){},
         * eventName2: function(){},
         * etc
         * }
         * @param {type} bindings - The bindings to bind
         */
        this.bind = function (bindings) {
            bindNodes(bindings, elements);
        }

        /**
         * Set the listener for this binding collection. This listener will have its functions
         * fired when a matching event is fired.
         * @param {type} listener
         */
        this.setListener = function (listener) {
            bindEvents(elements, listener);
        }

        /**
         * Use the bindings to output data. The inner html of all the matching bindings will be replaced
         * with the values provided by data. The output will be escaped for xss.
         * @param {type} data
         */
        this.output = function (data) {
            bindData(data, elements);
        }
    };
});