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
        $(parentComponent).empty();
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

//Auto find components on the page
(function ($, h) {
    var query = "data-htmlrest-component";
    var componentElements = $('[' + query + ']');

    //Read components backward, removing children from parents along the way.
    for (var i = componentElements.length - 1; i >= 0; --i) {
        (function () {
            var element = componentElements[i];
            var jQueryElement = $(element);
            var componentName = jQueryElement.attr(query);
            element.removeAttribute(query);
            var componentString = element.outerHTML;
            jQueryElement.remove();

            h.registerComponent(componentName, function (data, parentComponent) {
                var itemMarkup = h.formatText(componentString, data);
                var appendItem = $(parentComponent);
                var newItem = $(itemMarkup);
                newItem.appendTo(appendItem);

                return newItem;
            });
        })();
    };
})(jQuery, htmlrest);