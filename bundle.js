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
//Rest Functions
htmlrest.event.prototype.rest = function () { }

htmlrest.event.prototype.rest.prototype.post = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.ajax.prototype.runner(url, 'post', evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.put = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.ajax.prototype.runner(url, 'put', evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.get = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.get.prototype.runner(url, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.get.prototype.runner = function (url, evt, sender, previousResult, runner) {
    $.ajax({
        method: 'get',
        url: url,
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
}

htmlrest.event.prototype.rest.prototype.ajax = function (url, method) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.ajax.prototype.runner(url, method, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.ajax.prototype.runner = function (url, method, evt, sender, previousResult, runner) {
    var request = {
        method: method,
        url: url,
        data: previousResult,
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    };

    if (method.toLowerCase() === 'put')
    {
        request.headers = {
            'X-HTTP-Method-Override': 'PUT'
        };
        request.method = 'POST';
    }

    $.ajax(request);
}

htmlrest.rest = new htmlrest.event.prototype.rest();
//Form Functions
htmlrest.event.prototype.form = function () { }

htmlrest.event.prototype.form.prototype.serialize = function (form) {
    return function (evt, sender, previousResult, runner) {
        if (form === undefined) {
            var toSend = sender;
        }
        else {
            toSend = form;
        }
        htmlrest.event.prototype.form.prototype.serialize.prototype.runner(toSend, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.serialize.prototype.runner = function (form, evt, sender, previousResult, runner) {
    runner.next(form.serialize());
}

htmlrest.event.prototype.form.prototype.populate = function (form) {
    return function (evt, sender, previousResult, runner) {
        if (form === undefined){
            var toSend = sender;
        }
        else {
            toSend = form;
        }
        htmlrest.event.prototype.form.prototype.populate.prototype.runner(toSend, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.populate.prototype.runner = function (form, evt, sender, previousResult, runner) {
    var data = previousResult;
    if (previousResult.success !== undefined){
        data = previousResult.data;
    }
    form.find('[name]').each(function () {
        $(this).val(data[$(this).attr('name')]);
    });
    runner.next(form.serialize());
}

htmlrest.form = new htmlrest.event.prototype.form();
//Output Function
htmlrest.event.prototype.output = function () { }

htmlrest.formatText = function (text, args) {
    if (!text || !args) {
        return text;
    }

    var output = "";
    var textStart = 0;
    var bracketStart = 0;
    var bracketEnd = 0;
    for (var i = 0; i < text.length; ++i) {
        switch (text[i]) {
            case '{':
                if (text[i + 1] != '{') {
                    bracketStart = i;
                }
                break;
            case '}':
                if (i + 1 == text.length || text[i + 1] != '}') {
                    bracketEnd = i;

                    if (bracketStart < bracketEnd - 1) {
                        output += text.substring(textStart, bracketStart);
                        output += args[text.substring(bracketStart + 1, bracketEnd)];
                        textStart = i + 1;
                    }
                }
                break;
        }
    }

    if (textStart < text.length) {
        output += text.substring(textStart, text.length);
    }

    return output;
}

htmlrest.event.prototype.output.prototype.httpResult = function (element, formatSuccess, formatDanger) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.output.prototype.httpResult.prototype.httpResultRunner(element, formatSuccess, formatDanger, evt, sender, previousResult, runner);
    };
}

//stick the class in the public method prototype
htmlrest.event.prototype.output.prototype.httpResult.prototype.httpResultRunner = function (element, formatSuccess, formatDanger, evt, sender, previousResult, runner) {

    if (previousResult.success) {
        element.html(htmlrest.formatText(formatSuccess, previousResult.data));
    }
    else {
        element.html(htmlrest.formatText(formatDanger, previousResult.data));
    }

    var dangerClass = element.attr('data-class-danger');
    if (dangerClass) {
        if (previousResult.success) {
            element.removeClass(dangerClass);
        }
        else {
            element.addClass(dangerClass);
        }
    }

    var successClass = element.attr('data-class-success');
    if (successClass) {
        if (previousResult.success) {
            element.addClass(successClass);
        }
        else {
            element.removeClass(successClass);
        }
    }

    runner.next(previousResult);
};

htmlrest.event.prototype.output.prototype.format = function (element, formatString) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.output.prototype.format.prototype.httpResultRunner(element, formatString, evt, sender, previousResult, runner);
    };
}

htmlrest.event.prototype.output.prototype.format.prototype.showRunner = function (element, formatString, evt, sender, previousResult, runner) {
    element.html(htmlrest.formatText(formatString, previousResult));
    runner.next(previousResult);
}

htmlrest.event.prototype.output.prototype.write = function (element, formatString) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.output.prototype.write.prototype.httpResultRunner(element, formatString, evt, sender, previousResult, runner);
    };
}

htmlrest.event.prototype.output.prototype.write.prototype.showRunner = function (element, formatString, evt, sender, previousResult, runner) {
    element.html(previousResult);
    runner.next(previousResult);
}

htmlrest.output = new htmlrest.event.prototype.output();