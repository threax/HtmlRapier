var htmlrest = htmlrest || {};

htmlrest.event = function (functions, returnVal) {
        if (returnVal === undefined) {
            returnVal = false;
        }

        return new htmlrest.event.prototype.runner(functions, returnVal);
    }

//Defining classes on event's prototype
htmlrest.event.prototype.runner = function (functions, returnVal) {
    var self = this;
    var functions = functions;
    var returnVal = returnVal;
    var currentFunc = -1;
    var sender = null;
    var event = null;

    this.next = function (previousResult) {
        if (++currentFunc < functions.length) {
            functions[currentFunc](event, sender, previousResult, self);
        }
    }

    return function (evt) {
        currentFunc = -1;
        sender = $(this);
        event = evt;
        self.next(null);
        return returnVal;
    }
}
//Form Functions
htmlrest.event.prototype.form = function () { }

htmlrest.event.prototype.form.prototype.serialize = function (form) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.form.prototype.serialize.prototype.serializeRunner(form, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.serializeSelf = function () {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.form.prototype.serialize.prototype.serializeRunner(sender, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.serialize.prototype.serializeRunner = function (form, evt, sender, previousResult, runner) {
    runner.next(form.serialize());
}

htmlrest.event.prototype.form.prototype.submit = function (form) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.form.prototype.submit.prototype.runner(form, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.submitSelf = function () {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.form.prototype.submit.prototype.runner(sender, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.submit.prototype.runner = function (form, evt, sender, previousResult, runner) {
    $.ajax({
        method: form.attr('method'),
        url: form.attr('action'),
        data: previousResult,
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqHHR: jqXHR });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqHHR: jqXHR });
        }
    });
}

htmlrest.form = new htmlrest.event.prototype.form();
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