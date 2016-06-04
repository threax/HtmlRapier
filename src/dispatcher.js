htmlrest.dispatch = function (name, data)
{
    if (htmlrest.dispatch.prototype.events.hasOwnProperty(name))
    {
        htmlrest.dispatch.prototype.events[name].forEach(function (element, index, array)
        {
            element(data);
        });
    }
}

htmlrest.dispatch.prototype.events = {};

htmlrest.bind = function (name, callback)
{
    if (!htmlrest.dispatch.prototype.events.hasOwnProperty(name))
    {
        htmlrest.dispatch.prototype.events[name] = [];
    }
    htmlrest.dispatch.prototype.events[name].push(callback);
}

htmlrest.unbind = function (name, callback)
{
    if (htmlrest.dispatch.prototype.events.hasOwnProperty(name))
    {
        var array = htmlrest.dispatch.prototype.events[name];
        var index = array.indexOf(callback);
        if (index > -1)
        {
            array.splice(index, 1);
        }
    }
}