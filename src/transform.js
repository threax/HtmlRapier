//Output Function
htmlrest.event.prototype.transform = function () { }

htmlrest.event.prototype.transform.prototype.store = function (storage) {
    return function (evt, sender, previousResult, runner) {
        var result = storage(previousResult);
        if (!result)
        {
            result = previousResult;
        }
        runner.next(result);
    };
}

htmlrest.transform = new htmlrest.event.prototype.transform();