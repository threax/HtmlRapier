"use strict";

jsns.define("htmlrest.bindingcollection", function (using) {
    var escape = using("htmlrest.escape");
    var typeId = using("htmlrest.typeidentifiers");
    var domQuery = using("htmlrest.domquery");
    var TextStream = using("htmlrest.textStream");

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

    function bindData(data, elements, dataTextElements) {
        //No found elements, iterate everything.
        if (dataTextElements === undefined) {
            dataTextElements = [];
            for (var eIx = 0; eIx < elements.length; ++eIx) {
                var element = elements[eIx];

                var iter = document.createNodeIterator(element, NodeFilter.SHOW_TEXT, function (node) {
                    var textStream = new TextStream(node.textContent);
                    if (textStream.foundVariable()) {
                        node.textContent = textStream.format(data);
                        dataTextElements.push({
                            node: node,
                            stream: textStream
                        });
                    }
                }, false);
                while (iter.nextNode()) { } //Have to walk to get results
            }
        }
        //Already found the text elements, output those.
        else {
            for (var i = 0; i < dataTextElements.length; ++i) {
                var node = dataTextElements[i];
                node.node.textContent = node.stream.format(data);
            }
        }

        return dataTextElements;
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

    //Constructor
    return function (elements) {
        elements = domQuery.all(elements);
        var dataTextElements = undefined;

        /**
         * Find the first binding that matches bindingName
         * @param {string} bindingName - The name of the binding to look up.
         * @returns {HTMLElement} - The found element
         */
        this.first = function (bindingName) {
            return lookupNodeInArray(bindingName, elements);
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
    };
});