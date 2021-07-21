"use strict";

import * as components from 'hr.components';
import * as ignoredNodes from 'hr.ignored';
import {Iterable, IteratorInterface} from 'hr.iterable';
import {ComponentBuilder, VariantBuilder} from 'hr.componentbuilder';

var browserSupportsTemplates = 'content' in document.createElement('template');
var anonTemplateIndex = 0;

type ComponentBuilderMap = {[key: string]: ComponentBuilder };

var extractedBuilders: ComponentBuilderMap = {};

function buildTemplateElements(nestedElementsStack: any[]) {
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

interface ElementPair{
    element: Element;
    templateElement: Element;
}

var templateIterables = new Iterable<Element>(Array.prototype.slice.call(document.getElementsByTagName("TEMPLATE")));
var templateElements: IteratorInterface<ElementPair>;
//If the browser supports templates, iterate through them after creating temp ones.
if (browserSupportsTemplates) {
    var nestedElementsStack = [];
    nestedElementsStack.push(templateIterables.iterator());
    templateElements = new Iterable<ElementPair>(function () {
        return buildTemplateElements(nestedElementsStack);
    }).iterator();
}
else {
    templateElements = templateIterables.select<ElementPair>(function (t) {
        return {
            element: t,
            templateElement: t
        }
    }).iterator();
}

var currentTemplate = templateElements.next();
while (!currentTemplate.done) {
    var currentBuilder = extractTemplate(currentTemplate.value, currentBuilder);
    //The iterator is incremented below where the comment says INC HERE
}

//Extract templates off the page
function extractTemplate(elementPair: ElementPair, currentBuilder: ComponentBuilder): ComponentBuilder {
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

    var elementParent = element.parentElement;
    elementParent.removeChild(element);

    var variantName = element.getAttribute("data-hr-variant");
    var componentName = element.getAttribute("data-hr-component");
    if (variantName === null) {
        //Check to see if this is an anonymous template, if so adjust the parent element and
        //name the template
        if (componentName === null) {
            componentName = 'AnonTemplate_' + anonTemplateIndex++;
            elementParent.setAttribute("data-hr-view-component", componentName);
        }

        var builder = new ComponentBuilder(componentString);
        extractedBuilders[componentName] = builder;
        components.register(componentName, builder);
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

export function setup() {
    //Doesn't do anything, but makes module load correctly.
    return true;
}