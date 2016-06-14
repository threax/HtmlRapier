htmlrest.createComponent = function (name, data, parentComponent)
{
    if (typeof(parentComponent) === 'string'){
        parentComponent = $(parentComponent);
    }
    if (parentComponent instanceof jQuery) {
        parentComponent = parentComponent[0];
    }
    if (htmlrest.createComponent.prototype.factory.hasOwnProperty(name)) {
        return htmlrest.createComponent.prototype.factory[name](data, parentComponent);
    }
}

htmlrest.registerComponent = function (name, createFunc) {
    htmlrest.createComponent.prototype.factory[name] = createFunc;
}

htmlrest.createComponent.prototype.factory = {};

//Repeater
htmlrest.event.prototype.component = function () { }
htmlrest.event.prototype.component.prototype.repeat = function (name, parentComponent) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.component.prototype.repeat.prototype.runner(name, parentComponent, evt, sender, previousResult, runner);
    };
}

htmlrest.event.prototype.component.prototype.repeat.prototype.runner = function (name, parentComponent, evt, sender, previousResult, runner) {
    if (previousResult.hasOwnProperty('jqXHR')) {
        previousResult = previousResult.data;
    }

    $(parentComponent).empty();

    $(previousResult).each(function (index, value) {
        htmlrest.createComponent(name, value, parentComponent);
    });
};

//Auto find components on the page
(function ($, h) {
    var query = "[data-htmlrest-component]";
    $(query).each(function (index, element) {
        var jQueryElement = $(element);
        var componentName = jQueryElement.attr('data-htmlrest-component');
        var componentString = element.outerHTML;
        h.registerComponent(componentName, function (data, parentComponent) {
            var itemMarkup = h.formatText(componentString, data);
            $(itemMarkup).appendTo(parentComponent);
        });
        jQueryElement.remove();
    });
})(jQuery, htmlrest);

htmlrest.component = new htmlrest.event.prototype.component();