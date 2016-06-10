var htmlrest = htmlrest || {};

htmlrest.event = function (functionCreator, returnVal)
{
    if (returnVal === undefined)
    {
        returnVal = false;
    }

    return new htmlrest.event.prototype.runner(functionCreator, returnVal, null);
}

htmlrest.run = function (source, functionCreator)
{
    var runner = new htmlrest.event.prototype.runner(functionCreator, false, source);
    runner();
}

htmlrest.func = function (func)
{
    return function (evt, sender, previousResult, runner)
    {
        var result = func(previousResult);
        if (!result)
        {
            result = previousResult;
        }
        runner.next(result);
    };
}

//Defining classes on event's prototype
htmlrest.event.prototype.runner = function (functionCreator, returnVal, sender)
{
    var self = this;
    var functionCreator = functionCreator;
    var returnVal = returnVal;
    var functions = null;
    var currentFunc = -1;
    var sender = sender;
    var event = null;

    this.next = function (previousResult)
    {
        if (++currentFunc < functions.length)
        {
            functions[currentFunc](event, sender, previousResult, self);
        }
    }

    return function (evt)
    {
        currentFunc = -1;
        if (!sender)
        {
            sender = $(this);
        }
        event = evt;
        functions = functionCreator(sender, event);
        self.next(null);
        return returnVal;
    }
}