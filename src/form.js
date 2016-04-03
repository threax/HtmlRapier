//Form Functions
htmlrest.event.prototype.form = function () { }

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
        data: form.serialize(),
        success: function (data, textStatus, jqXHR) {
            runner.next(jqXHR);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next(jqXHR);
        }
    });
}

htmlrest.form = new htmlrest.event.prototype.form();