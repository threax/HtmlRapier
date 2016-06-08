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