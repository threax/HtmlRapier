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