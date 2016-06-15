htmlrest.createComponent = function (name, data, parentComponent, createdCallback)
{
    if (typeof(parentComponent) === 'string'){
        parentComponent = $(parentComponent);
    }
    if (parentComponent instanceof jQuery) {
        parentComponent = parentComponent[0];
    }
    if (htmlrest.createComponent.prototype.factory.hasOwnProperty(name)) {
        var created = htmlrest.createComponent.prototype.factory[name](data, parentComponent);
        if(createdCallback !== undefined)
        {
            createdCallback(created);
        }
        return created;
    }
}

htmlrest.registerComponent = function (name, createFunc) {
    htmlrest.createComponent.prototype.factory[name] = createFunc;
}

htmlrest.createComponent.prototype.factory = {};

htmlrest.event.prototype.component = function () { }

//Repeater
htmlrest.event.prototype.component.prototype.repeat = function (name, parentComponent) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.component.prototype.repeat.prototype.runner(name, parentComponent, evt, sender, previousResult, runner);
    };
}

htmlrest.event.prototype.component.prototype.repeat.prototype.runner = function (name, parentComponent, evt, sender, previousResult, runner) {
    if (previousResult.hasOwnProperty('jqXHR')) {
        previousResult = previousResult.data;
    }

    $(previousResult).each(function (index, value) {
        htmlrest.createComponent(name, value, parentComponent);
    });
};

//Empty component
htmlrest.event.prototype.component.prototype.empty = function (parentComponent) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.component.prototype.empty.prototype.runner(parentComponent, evt, sender, previousResult, runner);
    };
}

htmlrest.event.prototype.component.prototype.empty.prototype.runner = function (parentComponent, evt, sender, previousResult, runner) {
    $(parentComponent).empty();
};

//Auto find components on the page
(function ($, h) {
    var query = "[data-htmlrest-component]";
    var childQuery = "[data-htmlrest-component-repeater]";
    var insertQuery = "[data-htmlrest-component-insert]";
    $(query).each(function (index, element) {
        var jQueryElement = $(element);
        var componentName = jQueryElement.attr('data-htmlrest-component');
        var componentString = element.outerHTML;

        //Look for a repeater element
        var parentElement = null;
        var repeaterElement = jQueryElement.find(childQuery);
        if (repeaterElement.length > 0) {
            componentString = repeaterElement[0].outerHTML;
            repeaterElement.remove();
            parentElement = element.outerHTML;
        }
        h.registerComponent(componentName, function (data, parentComponent) {
            var itemMarkup = h.formatText(componentString, data);
            var appendItem = $(parentComponent);

            //Look for an insert point element in the parent, if one exists use it.
            var insertPoint = appendItem.find(insertQuery);
            if (insertPoint.length > 0) {
                appendItem = insertPoint[0];
            }

            if (parentElement !== null) {
                //If we have a parent element, find where to put the child
                if (appendItem[0].childCount > 0) {
                    //If the element is empty, append our parent component and use that as the
                    //item to append children to.
                    var newParent = $(parentElement);
                    newParent.appendTo(appendItem);
                    appendItem = newParent;
                }
                else {
                    //Otherwise get the first child, we have good control over how these elements
                    //are rendered, so assume the first child is the parent we put there.
                    appendItem = appendItem.children()[0];
                }
            }

            var newItem = $(itemMarkup);
            newItem.appendTo(appendItem);
            return newItem;
        });
        jQueryElement.remove();
    });
})(jQuery, htmlrest);

htmlrest.component = new htmlrest.event.prototype.component();