//Table Functions
htmlrest.table = htmlrest.table || {
    populate: function (table, data, rowCreatedCallback) {
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
            var rowData = data[i];
            var rowMarkup = $(htmlrest.formatText(realBody.rowHtml, rowData));
            rowMarkup.appendTo(tbody);
            rowCreatedCallback(rowMarkup, rowData);
        }

        runner.next(previousResult);
    }
};