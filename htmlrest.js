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
//htmlrest.classes.output = function() {
//    
//};
//
//htmlrest.classes.output.prototype.httpResult = function (target, evt, sender, previousResult, runner) {
//    target.html('did something');
//
//    var errorClass = target.attr('data-class-error');
//    if (errorClass) {
//        if (success) {
//            target.removeClass(errorClass);
//        }
//        else {
//            target.addClass(errorClass);
//        }
//    }
//
//    var successClass = target.attr('data-class-success');
//    if (successClass) {
//        if (success) {
//            target.addClass(successClass);
//        }
//        else {
//            target.removeClass(successClass);
//        }
//    }
//};
//
//htmlrest.output = new htmlrest.classes.output();

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

//htmlrest.runners.form.prototype.submit = function (form, evt, sender, previousResult, runner) {
//    $.ajax({
//        method: form.attr('method'),
//        url: form.attr('action'),
//        data: form.serialize(),
//        success: function (data, textStatus, jqXHR) {
//            runner.next(jqXHR);
//        },
//        error: function (jqXHR, textStatus, errorThrown) {
//            runner.next(jqXHR);
//        }
//    });
//};

//htmlrest.classes.form.prototype.submitHandler = function (evt) {
//    htmlrest.form.submit($(this));
//    return false;
//}

htmlrest.form = new htmlrest.classes.form();