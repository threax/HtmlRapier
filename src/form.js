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

htmlrest.event.prototype.form.prototype.serialize.prototype.runner = function (form, evt, sender, previousResult, runner)
{
    var data = {};
    form.serializeArray().map(function (x) { data[x.name] = x.value; });
    runner.next(data);
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

    runner.next(previousResult);
}

htmlrest.form = new htmlrest.event.prototype.form();