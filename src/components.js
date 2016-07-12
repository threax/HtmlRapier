"use strict";

(function () {

    htmlrest.createComponent = function (name, data, parentComponent, createdCallback) {
        parentComponent = htmlrest.component.getPlainElement(parentComponent);
        if (htmlrest.createComponent.prototype.factory.hasOwnProperty(name)) {
            var created = htmlrest.createComponent.prototype.factory[name](data, parentComponent);
            if (createdCallback !== undefined) {
                createdCallback(created, data);
            }
            return created;
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
                element = s(element)[0];
            }
            if (element instanceof jQuery) {
                element = element[0];
            }
            return element;
        }
    };

    //Auto find components on the page and build them as components
    (function (s, h) {
        //Component creation function
        function createItem(data, componentString, parentComponent) {
            var itemMarkup = h.formatText(componentString, data);
            var newItem = str2DOMElement(itemMarkup);
            parentComponent.appendChild(newItem);

            return newItem;
        }

        var attrName = "data-htmlrest-component";
        var componentElements = s('[' + attrName + ']');
        document.get
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

    //From jQuery and the discussion on http://krasimirtsonev.com/blog/article/Revealing-the-magic-how-to-properly-convert-HTML-string-to-a-DOM-element
    var str2DOMElement = function (html) {
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
            if (tag.toLowerCase() === 'body') {
                var dom = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
                var body = document.createElement("body");
                // keeping the attributes
                element.innerHTML = html.replace(/<body/g, '<div').replace(/<\/body>/g, '</div>');
                var attrs = element.firstChild.attributes;
                body.innerHTML = html;
                for (var i = 0; i < attrs.length; i++) {
                    body.setAttribute(attrs[i].name, attrs[i].value);
                }
                return body;
            } else {
                var map = wrapMap[tag] || wrapMap._default, element;
                html = map[1] + html + map[2];
                element.innerHTML = html;
                // Descend through wrappers to the right content
                var j = map[0] + 1;
                while (j--) {
                    element = element.lastChild;
                }
            }
        } else {
            element.innerHTML = html;
            element = element.lastChild;
        }
        return element;
    }
})();