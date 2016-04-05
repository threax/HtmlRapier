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
    for (i = 0; i < text.length; ++i) {
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