"use strict";

(function () {
    var supportsTemplates = 'content' in document.createElement('template');

    htmlrest.createComponent = function (name, data, parentComponent, createdCallback) {
        parentComponent = htmlrest.component.getPlainElement(parentComponent);
        if (htmlrest.createComponent.prototype.factory.hasOwnProperty(name)) {
            var created = htmlrest.createComponent.prototype.factory[name](data, parentComponent);
            if (createdCallback !== undefined) {
                createdCallback(created, data);
            }
            return created;
        }

        //Also support template based creation if available
        if (supportsTemplates) {
            var template = document.querySelector('#' + name);
            if (template != null && template.tagName === "TEMPLATE") {
                created = document.importNode(template.content, true);
                parentComponent.appendChild(created);

                if (createdCallback !== undefined) {
                    createdCallback(created, data);
                }
                return created;
            }
        }
    }

    htmlrest.registerComponent = function (name, createFunc) {
        htmlrest.createComponent.prototype.factory[name] = createFunc;
    }

    htmlrest.createComponent.prototype.factory = {};

    htmlrest.component = htmlrest.component || {
        //Repeater
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
            else {
                htmlrest.createComponent(name, value, parentComponent, createdCallback);
            }
        },

        //Empty component
        empty: function (parentComponent) {
            parentComponent = htmlrest.component.getPlainElement(parentComponent);

            while (parentComponent.firstChild) {
                parentComponent.removeChild(parentComponent.firstChild);
            }
        },

        //Get Plain Javascript Element
        getPlainElement: function (element) {
            if (typeof (element) === 'string') {
                element = $(element);
            }
            if (element instanceof jQuery) {
                element = element[0];
            }
            return element;
        }
    };

    //Auto find components on the page and build them as components
    (function ($, s, h) {
        //Component creation function
        function createItem(data, componentString, parentComponent) {
            var itemMarkup = h.formatText(componentString, data);
            var appendItem = $(parentComponent);
            var newItem = $(itemMarkup);
            newItem.appendTo(appendItem);

            return newItem[0];
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

        //If we don't support templates, extract them as components also
        if (!supportsTemplates) {
            var templateElements = document.getElementsByTagName("TEMPLATE");
            while(templateElements.length > 0) {
                (function () {
                    var element = templateElements[0];
                    var componentName = element.getAttribute("id");
                    var componentString = element.innerHTML;
                    element.parentNode.removeChild(element);

                    h.registerComponent(componentName, function (data, parentComponent) {
                        return createItem(data, componentString, parentComponent);
                    });
                })();
            }
        }

    })(jQuery, Sizzle, htmlrest);
})();