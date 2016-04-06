var htmlrest = htmlrest || {};

htmlrest.event = function (functions, returnVal) {
        if (returnVal === undefined) {
            returnVal = false;
        }

        return new htmlrest.event.prototype.runner(functions, returnVal);
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
//Rest Functions
htmlrest.event.prototype.rest = function () { }

htmlrest.event.prototype.rest.prototype.post = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.post.prototype.runner(url, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.post.prototype.runner = function (url, evt, sender, previousResult, runner) {
    $.ajax({
        method: 'post',
        url: previousResult,
        data: data,
        success: function (retData, textStatus, jqXHR) {
            runner.next({ data: retData, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
}

htmlrest.event.prototype.rest.prototype.put = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.put.prototype.runner(url, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.put.prototype.runner = function (url, evt, sender, previousResult, runner) {
    $.ajax({
        method: 'put',
        url: url,
        data: previousResult,
        success: function (retData, textStatus, jqXHR) {
            runner.next({ data: retData, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
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
    $.ajax({
        method: method,
        url: url,
        data: previousResult,
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
}

htmlrest.rest = new htmlrest.event.prototype.rest();
//Form Functions
htmlrest.event.prototype.form = function () { }

htmlrest.event.prototype.form.prototype.serialize = function (form) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.form.prototype.serialize.prototype.runner(form, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.serializeSelf = function () {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.form.prototype.serialize.prototype.runner(sender, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.serialize.prototype.runner = function (form, evt, sender, previousResult, runner) {
    runner.next(form.serialize());
}

htmlrest.event.prototype.form.prototype.submit = function (form, data) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.form.prototype.submit.prototype.runner(form, data, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.submitSelf = function (data) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.form.prototype.submit.prototype.runner(sender, data, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.form.prototype.submit.prototype.runner = function (form, data, evt, sender, previousResult, runner) {
    $.ajax({
        method: form.attr('method'),
        url: form.attr('action'),
        data: form.serialize(),
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqXHR: jqXHR, success:true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
}

htmlrest.event.prototype.form.prototype.populateSelf = function () {
    return function (evt, sender, previousResult, runner) {
        var hiddenRunner = new htmlrest.event.prototype.runner([function (evt, sender, previousResult, hiddenRunner) {
            alert('got to populate');
            runner.next(evt, sender, previousResult, runner);
        }], false);
        htmlrest.event.prototype.rest.prototype.get.prototype.runner(sender.attr('data-source'), evt, sender, previousResult, hiddenRunner);
    }
}

htmlrest.event.prototype.form.prototype.populate = function (form) {
    return function (evt, sender, previousResult, runner) {
        var hiddenRunner = new htmlrest.event.prototype.runner([function (evt, sender, previousResult, hiddenRunner) {
            alert('got to populate');
            runner.next(evt, sender, previousResult, runner);
        }], false);
        htmlrest.event.prototype.rest.prototype.get.prototype.runner(form.attr('data-source'), evt, sender, previousResult, hiddenRunner);
    }
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