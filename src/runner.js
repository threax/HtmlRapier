var htmlrest = htmlrest || {};

htmlrest.event = function (functions, returnVal) {
        if (returnVal === undefined) {
            returnVal = false;
        }

        return new htmlrest.event.prototype.runner(functions, returnVal, null);
}

htmlrest.run = function (source, functions) {
    var runner = new htmlrest.event.prototype.runner(functions, false, source);
    runner();
}

htmlrest.func = function (func) {
    return function (evt, sender, previousResult, runner) {
        var result = func(previousResult);
        if (!result) {
            result = previousResult;
        }
        runner.next(result);
    };
}

//Defining classes on event's prototype
htmlrest.event.prototype.runner = function (functions, returnVal, sender) {
    var self = this;
    var functions = functions;
    var returnVal = returnVal;
    var currentFunc = -1;
    var sender = sender;
    var event = null;

    this.next = function (previousResult) {
        if (++currentFunc < functions.length) {
            functions[currentFunc](event, sender, previousResult, self);
        }
    }

    return function (evt) {
        currentFunc = -1;
        if (!sender) {
            sender = $(this);
        }
        event = evt;
        self.next(null);
        return returnVal;
    }
}