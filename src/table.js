//Table Functions
htmlrest.event.prototype.table = function () { }

htmlrest.event.prototype.table.prototype.populate = function (table) {
    return function (evt, sender, previousResult, runner) {
        if (table === undefined) {
            var toSend = sender;
        }
        else {
            toSend = table;
        }
        htmlrest.event.prototype.table.prototype.populate.prototype.runner(toSend, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.table.prototype.populate.prototype.runner = function (table, evt, sender, previousResult, runner) {
    var data = previousResult;
    if (previousResult.success !== undefined){
        data = previousResult.data;
    }

    //table.find('[name]').each(function () {
    //    $(this).val(data[$(this).attr('name')]);
    //});

    runner.next(previousResult);
}

htmlrest.form = new htmlrest.event.prototype.form();