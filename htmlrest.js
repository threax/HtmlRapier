var htmlrest = htmlrest || {};
htmlrest.classes = htmlrest.classes || {};
htmlrest.runners = htmlrest.runners || {};

htmlrest.er = function (returnVal, functions)
{
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

    this.eventHandler = function (evt) {
        currentFunc = 0;
        sender = $(this);
        event = evt;
        self.next(null);
        return returnVal;
    }
}

//Output Function
htmlrest.classes.output = function() {
    function httpResultRunner(element, evt, sender, previousResult, runner) {
        element.html('did something');

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
    };

    this.httpResult = function (element) {
        return function (evt, sender, previousResult, runner) {
            httpResultRunner(element, evt, sender, previousResult, runner);
        };
    }
};

htmlrest.output = new htmlrest.classes.output();

//Form Functions
htmlrest.classes.form = function () {
    function submitRunner(form, evt, sender, previousResult, runner) {
        $.ajax({
            method: form.attr('method'),
            url: form.attr('action'),
            data: form.serialize(),
            success: function (data, textStatus, jqXHR) {
                runner.next(jqXHR);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                runner.next(jqXHR);
            }
        });
    }

    this.submit = function (form) {
        return function (evt, sender, previousResult, runner) {
            submitRunner(form, evt, sender, previousResult, runner);
        }
    }

    this.submitSelf = function () {
        return function (evt, sender, previousResult, runner) {
            submitRunner(sender, evt, sender, previousResult, runner);
        }
    }
};

htmlrest.form = new htmlrest.classes.form();