﻿"use strict";

import * as domquery from './hr.domquery';
import {BindingCollection} from './hr.bindingcollection';
import * as TextStream from './hr.textstream';
import * as components from './hr.components';
import * as ignoredNodes from './hr.ignored';
import * as Iterable from './hr.iterable';

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

function VariantBuilder(componentString) {
    var tokenizedString;
    var currentBuildFunc = tokenize;

    function tokenize(data, parentComponent, insertBeforeSibling) {
        tokenizedString = new TextStream(componentString);
        currentBuildFunc = build;
        return build(data, parentComponent, insertBeforeSibling);
    }

    function build(data, parentComponent, insertBeforeSibling) {
        return createItem(data, tokenizedString, parentComponent, insertBeforeSibling);
    }

    function create(data, parentComponent, insertBeforeSibling) {
        return currentBuildFunc(data, parentComponent, insertBeforeSibling);
    }
    this.create = create;
}

function ComponentBuilder(componentString) {
    var variants = {};
    var tokenizedString;
    var currentBuildFunc = tokenize;

    function tokenize(data, parentComponent, insertBeforeSibling) {
        tokenizedString = new TextStream(componentString);
        currentBuildFunc = build;
        return build(data, parentComponent, insertBeforeSibling);
    }

    function build(data, parentComponent, insertBeforeSibling) {
        return createItem(data, tokenizedString, parentComponent, insertBeforeSibling);
    }

    function create(data, parentComponent, insertBeforeSibling, variant) {
        if (variant !== null && variants.hasOwnProperty(variant)) {
            return variants[variant].create(data, parentComponent, insertBeforeSibling);
        }
        return currentBuildFunc(data, parentComponent, insertBeforeSibling);
    }
    this.create = create;

    function addVariant(name, variantBuilder) {
        variants[name] = variantBuilder;
    }
    this.addVariant = addVariant;
}

var extractedBuilders = {};

function buildTemplateElements(nestedElementsStack) {
    if (nestedElementsStack.length > 0) {
        var currentTopLevelTemplate = nestedElementsStack[nestedElementsStack.length - 1].next();
        if (!currentTopLevelTemplate.done) {
            var element = currentTopLevelTemplate.value;
            var templateElement = document.createElement('div');
            templateElement.appendChild(document.importNode(element.content, true));
            var innerTemplates = templateElement.getElementsByTagName("TEMPLATE");
            if (innerTemplates.length > 0) {
                nestedElementsStack.push(new Iterable(Array.prototype.slice.call(innerTemplates)).iterator());
            }
            return {
                element: element,
                templateElement: templateElement
            };
        }
        else {
            nestedElementsStack.pop();
            return buildTemplateElements(nestedElementsStack);
        }
    }
}

var templateElements = new Iterable(Array.prototype.slice.call(document.getElementsByTagName("TEMPLATE")));
//If the browser supports templates, iterate through them after creating temp ones.
if (browserSupportsTemplates) {
    var nestedElementsStack = [];
    nestedElementsStack.push(templateElements.iterator());
    templateElements = new Iterable(function () {
        return buildTemplateElements(nestedElementsStack);
    });
}
else {
    templateElements = templateElements.select(function (t) {
        return {
            element: t,
            templateElement: t
        }
    });
}
templateElements = templateElements.iterator();

var currentTemplate = templateElements.next();
while (!currentTemplate.done) {
    var currentBuilder = extractTemplate(currentTemplate.value, currentBuilder);
    //The iterator is incremented below where the comment says INC HERE
}

//Extract templates off the page
function extractTemplate(elementPair, currentBuilder) {
    var element = elementPair.element;

    //INC HERE - This is where currentTemplate is incremented to its next value
    //This single iter is shared for all levels of the gatherer
    currentTemplate = templateElements.next();

    //Check to see if this is an ignored element, and quickly exit if it is
    if (ignoredNodes.isIgnored(element)) {
        return currentBuilder;
    }

    var templateElement = elementPair.templateElement;

    //Look for nested child templates, do this before taking inner html so children are removed
    while (!currentTemplate.done && templateElement.contains(currentTemplate.value.element)) {
        var currentBuilder = extractTemplate(currentTemplate.value, currentBuilder);
    }

    var componentString = templateElement.innerHTML.trim();

    //Special case for tables in ie, cannot create templates without a surrounding table element, this will eliminate that unless requested otherwise
    if (templateElement.childElementCount === 1 && templateElement.firstElementChild.tagName === 'TABLE' && !element.hasAttribute('data-hr-keep-table')) {
        var tableElement = templateElement.firstElementChild;
        if (tableElement.childElementCount > 0 && tableElement.firstElementChild.tagName === 'TBODY') {
            componentString = tableElement.firstElementChild.innerHTML.trim();
        }
        else {
            componentString = tableElement.innerHTML.trim();
        }
    }

    var elementParent = element.parentNode;
    elementParent.removeChild(element);

    var variantName = element.getAttribute("data-hr-variant");
    var componentName = element.getAttribute("data-hr-component");
    if (variantName === null) {
        //Check to see if this is an anonymous template, if so adjust the parent element and
        //name the template
        if (componentName === null) {
            componentName = 'AnonTemplate_' + anonTemplateIndex++;
            elementParent.setAttribute("data-hr-model-component", componentName);
        }

        var builder = new ComponentBuilder(componentString);
        extractedBuilders[componentName] = builder;
        components.register(componentName, builder.create);
        return builder;
    }
    else {
        if (componentName === null) {
            if (currentBuilder !== undefined) {
                currentBuilder.addVariant(variantName, new VariantBuilder(componentString));
            }
            else {
                console.log('Attempted to create a variant named "' + variantName + '" with no default component in the chain. Please start your template element chain with a data-hr-component or a anonymous template. This template has been ignored.');
            }
        }
        else {
            extractedBuilders[componentName].addVariant(variantName, new VariantBuilder(componentString));
        }
        return currentBuilder;
    }
}

//Actual creation function
var str2DOMElement = function (html) {
    //From j Query and the discussion on http://krasimirtsonev.com/blog/article/Revealing-the-magic-how-to-properly-convert-HTML-string-to-a-DOM-element
    //Modified, does not support body tags and returns collections of children

    var wrapMap: any = {
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
    var element: any = document.createElement('div');
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