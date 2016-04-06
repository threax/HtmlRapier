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

    //Clone the first row
    var tbody = table.find('tbody');
    var rowHtml = tbody.children().get(0).outerHTML;
    tbody.html('');

    var length = data.length;
    for (var i = 0; i < length; ++i) {
        var item = data[i];
        $(rowHtml).appendTo(tbody).each(function () {
            $(this).children().each(function () {
                var name = $(this).attr('data-name');
                var output = '';
                if (name !== undefined) {
                    output = item[name];
                }

                $(this).html(output);
            });
        });
    }

    runner.next(previousResult);
}

htmlrest.table = new htmlrest.event.prototype.table();