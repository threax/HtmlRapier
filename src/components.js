htmlrest.createComponent = function (name, data, parentComponent, createdCallback)
{
    if (typeof (parentComponent) === 'string')
    {
        parentComponent = $(parentComponent);
    }
    if (parentComponent instanceof jQuery)
    {
        parentComponent = parentComponent[0];
    }
    if (htmlrest.createComponent.prototype.factory.hasOwnProperty(name))
    {
        var created = htmlrest.createComponent.prototype.factory[name](data, parentComponent);
        if (createdCallback !== undefined)
        {
            createdCallback(created, data);
        }
        return created;
    }
}

htmlrest.registerComponent = function (name, createFunc)
{
    htmlrest.createComponent.prototype.factory[name] = createFunc;
}

htmlrest.createComponent.prototype.factory = {};

htmlrest.component = htmlrest.component || {
    //Repeater
    repeat: function (name, parentComponent, previousResult, createdCallback)
    {
        $(previousResult).each(function (index, value)
        {
            htmlrest.createComponent(name, value, parentComponent, createdCallback);
        });
    },

    //Empty component
    empty: function (parentComponent)
    {
        $(parentComponent).empty();
    }
};

//Auto find components on the page
(function ($, h)
{
    var query = "data-htmlrest-component";
    var componentElements = $('[' + query + ']');

    //Read components backward, removing children from parents along the way.
    for (var i = componentElements.length - 1; i >= 0; --i)
    {
        (function ()
        {
            var element = componentElements[i];
            var jQueryElement = $(element);
            var componentName = jQueryElement.attr(query);
            element.removeAttribute(query);
            var componentString = element.outerHTML;
            jQueryElement.remove();

            h.registerComponent(componentName, function (data, parentComponent)
            {
                var itemMarkup = h.formatText(componentString, data);
                var appendItem = $(parentComponent);
                var newItem = $(itemMarkup);
                newItem.appendTo(appendItem);

                return newItem;
            });
        })();
    };
})(jQuery, htmlrest);