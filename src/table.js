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

    //Clone the first row if needed
    var tbody = table.find('tbody');
    var realBody = tbody.get(0);
    if (realBody.rowHtml === undefined) {
        //Store our original html string in the table body's actual object
        realBody.rowHtml = tbody.children().get(0).outerHTML;
    }
    tbody.html('');

    var length = data.length;
    for (var i = 0; i < length; ++i) {
        tbody.append(htmlrest.formatText(realBody.rowHtml, data[i]));
    }

    runner.next(previousResult);
}

htmlrest.table = new htmlrest.event.prototype.table();