//Output Function
htmlrest.event.prototype.output = function () { }

htmlrest.event.prototype.output.prototype.httpResult = function (element) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.output.prototype.httpResult.prototype.httpResultRunner(element, evt, sender, previousResult, runner);
    };
}

//stick the class in the public method prototype
htmlrest.event.prototype.output.prototype.httpResult.prototype.httpResultRunner = function (element, evt, sender, previousResult, runner) {
    element.html(previousResult);

    var errorClass = element.attr('data-class-error');
    if (errorClass) {
        if (success) {
            element.removeClass(errorClass);
        }
        else {
            element.addClass(errorClass);
        }
    }

    var successClass = element.attr('data-class-success');
    if (successClass) {
        if (success) {
            element.addClass(successClass);
        }
        else {
            element.removeClass(successClass);
        }
    }

    runner.next();
};

htmlrest.event.prototype.output.prototype.format = function (formatter) {
    return function (evt, sender, previousResult, runner) {
        runner.next(formatter(previousResult));
    };
}

htmlrest.output = new htmlrest.event.prototype.output();