"use strict";

//Auto find components on the page and build them as components
jsns.run([
    "htmlrest.domquery",
    "htmlrest.bindingcollection",
    "htmlrest.textstream",
    "htmlrest.components"
],
function (exports, module, domquery, BindingCollection, TextStream, components) {
    var browserSupportsTemplates = 'content' in document.createElement('template');
    var anonTemplateIndex = 0;

    //Component creation function
    function createItem(data, componentStringStream, parentComponent, insertBeforeSibling) {
        var itemMarkup = componentStringStream.format(data);
        var newItems = str2DOMElement(itemMarkup);
        var arrayedItems = [];

        for (var i = 0; i < newItems.length; ++i) {
            var newItem = newItems[i];
            parentComponent.insertBefore(newItem, insertBeforeSibling);
            arrayedItems.push(newItem);
        }

        return new BindingCollection(arrayedItems);
    }

    //Extract templates off the page
    function extractTemplate(element) {
        var componentName = element.getAttribute("data-hr-component");

        //Check to see if this is an anonymous template, if so adjust the parent element and
        //name the template
        if (componentName === null) {
            componentName = 'AnonTemplate_' + anonTemplateIndex++;
            element.parentElement.setAttribute("data-hr-model-component", componentName);
        }

        //If the browser supports templates, need to create one to read it properly
        var templateElement = element;
        if (browserSupportsTemplates) {
            var templateElement = document.createElement('div');
            templateElement.appendChild(document.importNode(element.content, true));
        }

        //Look for nested child templates, do this before taking inner html so children are removed
        var childTemplates = templateElement.getElementsByTagName("TEMPLATE");
        while (childTemplates.length > 0) {
            extractTemplate(childTemplates[0]);
        }

        var componentString = templateElement.innerHTML.trim();
        element.parentNode.removeChild(element);

        components.register(componentName, function (data, parentComponent, insertBeforeSibling) {
            //First creation does more work with this function, then reregisters a simplified version
            //Tokenize string
            var tokenizedString = new TextStream(componentString);
            //Register component again
            components.register(componentName, function (data, parentComponent, insertBeforeSibling) {
                //Return results, this is called for each subsequent creation
                return createItem(data, tokenizedString, parentComponent, insertBeforeSibling);
            });
            //Return results
            return createItem(data, tokenizedString, parentComponent, insertBeforeSibling);
        });
    }

    var templateElements = document.getElementsByTagName("TEMPLATE");
    while (templateElements.length > 0) {
        extractTemplate(templateElements[0]);
    }

    //Actual creation function
    var str2DOMElement = function (html) {
        //From j Query and the discussion on http://krasimirtsonev.com/blog/article/Revealing-the-magic-how-to-properly-convert-HTML-string-to-a-DOM-element
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
});