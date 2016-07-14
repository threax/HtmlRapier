"use strict";

(function () {

    var factory = {};

    /**
     * This callback is called when a component is created
     * @callback htmlrest.createComponent~callback
     * @param {htmlrest.component.BindingCollection} created
     * @param {object} data
     */

    /**
     * Create a new component specified by name with the data in data attached to parentComponent. You can also
     * get a callback whenever a component is created by passing a createdCallback.
     * @param {string} name - The name of the component to create. These are specified on the page with a data-htmlrest-component
     * attribute or can be manually specified.
     * @param {object} data - The data to bind to the component.
     * @param {HTMLElement} parentComponent - The html element to attach the component to.
     * @param {htmlrest.createComponent~callback} createdCallback - The callback called when the component is created.
     * @returns {htmlrest.component.BindingCollection} 
     */
    htmlrest.createComponent = function (name, data, parentComponent, createdCallback) {
        parentComponent = htmlrest.component.getPlainElement(parentComponent);
        if (factory.hasOwnProperty(name)) {
            var created = factory[name](data, parentComponent);
            if (createdCallback !== undefined) {
                createdCallback(created, data);
            }
            return created;
        }
    }

    /**
     * This callback is used to create components when they are requested.
     * @callback htmlrest.registerComponent~callback
     * @param {htmlrest.component.BindingCollection} created
     * @param {object} data
     * @returns {htmlrest.component.BindingCollection} 
     */

    /**
     * Register a function with the component system.
     * @param {string} name - The name of the component
     * @param {htmlrest.registerComponent~callback} createFunc - The function that creates the new component.
     */
    htmlrest.registerComponent = function (name, createFunc) {
        factory[name] = createFunc;
    }

    htmlrest.component = htmlrest.component || {
        /**
         * Create a component for each element in data using that element as the data for the component.
         * @param {string} name - The name of the component to create. These are specified on the page with a data-htmlrest-component
         * @param {HTMLElement} parentComponent - The html element to attach the component to.
         * @param {array|object} data - The data to repeat and bind, must be an array or object so it can be iterated.
         * @param {htmlrest.createComponent~callback} createdCallback
         */
        repeat: function (name, parentComponent, data, createdCallback) {
            if (Array.isArray(data)) {
                for (var i = 0; i < data.length; ++i) {
                    htmlrest.createComponent(name, data[i], parentComponent, createdCallback);
                }
            }
            else if (typeof data === 'object') {
                for (var key in data) {
                    htmlrest.createComponent(name, data[key], parentComponent, createdCallback);
                }
            }
        },

        /**
         * Remove all children from an html element.
         * @param {HTMLElement} parentComponent - The component to remove all children from
         */
        empty: function (parentComponent) {
            parentComponent = htmlrest.component.getPlainElement(parentComponent);

            while (parentComponent.firstChild) {
                parentComponent.removeChild(parentComponent.firstChild);
            }
        },

        /**
         * Derive the plain javascript element from a passed element
         * @param {string|HTMLElement} element - the element to detect
         * @returns {HTMLElement} - The located html element.
         */
        getPlainElement: function (element) {
            if (typeof (element) === 'string') {
                element = Sizzle(element)[0];
            }
            if (element instanceof jQuery) {
                element = element[0];
            }
            return element;
        },

        /**
         * @param {string|array} elements - the elements to use for this collection.
         */
        BindingCollection: function (elements) {
            if (htmlrest.isString(elements)) {
                var query = elements;
                elements = [];
                Sizzle(query, document, elements);
            }
            else if (!Array.isArray(elements)) {
                elements = [elements];
            }

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
            this.all = function (bindingName, callback) {
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
            this.bind = function(bindings){
                bindNodes(bindings, elements);
            }
        },
    };

    function bindNodes(bindings, elements) {
        for (var key in bindings) {
            var query = '[data-htmlrest-binding=' + key + ']';
            for (var eIx = 0; eIx < elements.length; ++eIx) {
                var element = elements[eIx];
                var child = null;
                if (Sizzle.matchesSelector(element, query)) {
                    child = element;
                }
                else {
                    child = Sizzle(query, element)[0];
                }

                if (child) {
                    var elementBindings = bindings[key];
                    for (var name in elementBindings) {
                        child.addEventListener(name, elementBindings[name]);
                    }
                }
            }
        }
    }

    function lookupNodeInArray(bindingName, elements) {
        var query = '[data-htmlrest-binding=' + bindingName + ']';
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            var child = null;
            if (Sizzle.matchesSelector(element, query)) {
                child = element;
            }
            else {
                child = Sizzle(query, element)[0];
            }

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
            var child = null;
            if (Sizzle.matchesSelector(element, query)) {
                child = element;
            }
            else {
                child = Sizzle(query, element)[0];
            }

            if (child) {
                callback(child);
            }
        }
    }

    //Auto find components on the page and build them as components
    (function (s, h) {
        //Component creation function
        function createItem(data, componentString, parentComponent) {
            var itemMarkup = h.formatText(componentString, data);
            var newItems = str2DOMElement(itemMarkup);
            var arrayedItems = [];

            for (var i = 0; i < newItems.length; ++i) {
                var newItem = newItems[i];
                parentComponent.appendChild(newItem);
                arrayedItems.push(newItem);
            }

            return new h.component.BindingCollection(arrayedItems);
        }

        var attrName = "data-htmlrest-component";
        var componentElements = s('[' + attrName + ']');
        //Read components backward, removing children from parents along the way.
        for (var i = componentElements.length - 1; i >= 0; --i) {
            (function () {
                var element = componentElements[i];
                var componentName = element.getAttribute(attrName);
                element.removeAttribute(attrName);
                var componentString = element.outerHTML;
                element.parentNode.removeChild(element);

                h.registerComponent(componentName, function (data, parentComponent) {
                    return createItem(data, componentString, parentComponent);
                });
            })();
        };

        //Also grab the templates from the page and use them too
        var templateElements = document.getElementsByTagName("TEMPLATE");
        while(templateElements.length > 0) {
            (function () {
                var element = templateElements[0];
                var componentName = element.getAttribute("id");
                var componentString = element.innerHTML.trim();
                element.parentNode.removeChild(element);

                h.registerComponent(componentName, function (data, parentComponent) {
                    return createItem(data, componentString, parentComponent);
                });
            })();
        }

    })(Sizzle, htmlrest);

    var str2DOMElement = function (html) {
        //From jQuery and the discussion on http://krasimirtsonev.com/blog/article/Revealing-the-magic-how-to-properly-convert-HTML-string-to-a-DOM-element
        //Modified, does not support body tags and returns collections of children

        var wrapMap = {
            option: [1, "<select multiple='multiple'>", "</select>"],
            legend: [1, "<fieldset>", "</fieldset>"],
            area: [1, "<map>", "</map>"],
            param: [1, "<object>", "</object>"],
            thead: [1, "<table>", "</table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            body: [0, "", ""],
            _default: [1, "<div>", "</div>"]
        };
        wrapMap.optgroup = wrapMap.option;
        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td;
        var match = /<\s*\w.*?>/g.exec(html);
        var element = document.createElement('div');
        if (match != null) {
            var tag = match[0].replace(/</g, '').replace(/>/g, '').split(' ')[0];
            var map = wrapMap[tag] || wrapMap._default, element;
            html = map[1] + html + map[2];
            element.innerHTML = html;
            // Descend through wrappers to the right content
            var j = map[0];
            while (j--) {
                element = element.lastChild;
            }
        } else {
            element.innerHTML = html;
        }

        return element.childNodes;
    }
})();