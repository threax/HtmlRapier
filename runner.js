var htmlrest = htmlrest || {};

//Primary runner class
htmlrest.event = function (functions, returnVal) {
    if (returnVal === undefined) {
        returnVal = false;
    }

    return new htmlrest.event.prototype.runner(functions, returnVal);
}

htmlrest.event.prototype.runner = function (functions, returnVal) {
    var self = this;
    var functions = functions;
    var returnVal = returnVal;
    var currentFunc = 0;
    var sender = null;
    var event = null;

    this.next = function (previousResult) {
        if (currentFunc < functions.length) {
            functions[currentFunc](event, sender, previousResult, self);
            currentFunc++;
        }
    }

    return function (evt) {
        currentFunc = 0;
        sender = $(this);
        event = evt;
        self.next(null);
        return returnVal;
    }
}