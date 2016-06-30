//Form Functions
htmlrest.form = htmlrest.form || {
    serialize: function (form)
    {
        var data = {};
        form.serializeArray().map(function (x) { data[x.name] = x.value; });
        return data;
    },

    populate: function (form, data)
    {
        form.find('[name]').each(function ()
        {
            $(this).val(data[$(this).attr('name')]);
        });
    },

    ajaxLifecycle: function(settings) {
        var form = $(settings.formQuery); //form is required

        var mainDisplay = undefined;
        if (settings.mainDisplayQuery) {
            mainDisplay = $(settings.mainDisplayQuery);
        }

        var populateFailDisplay = undefined;
        if (settings.populateFailDisplayQuery) {
            populateFailDisplay = $(settings.populateFailDisplayQuery);
        }

        var loadingDisplay = undefined;
        if (settings.loadingDisplayQuery) {
            loadingDisplay = $(settings.loadingDisplayQuery);
        }

        //Populate
        this.populateData = function () {
            loading();
            var url = form.attr('action');
            htmlrest.rest.get(url, getSuccess, getFail);
        }

        function getSuccess(data) {
            hideAll();
            htmlrest.form.populate(form, data);
            if (mainDisplay) {
                mainDisplay.show();
            }
        }

        function getFail(data) {
            hideAll();
            if (populateFailDisplay) {
                populateFailDisplay.show();
            }
        }

        //Submit
        form.submit(function () {
            loading();
            var url = form.attr('action');
            var data = htmlrest.form.serialize(form);
            htmlrest.rest.post(url, data, postSuccess, postFail);
            return false;
        });

        function postSuccess(data) {
            hideAll();
            if (mainDisplay) {
                mainDisplay.show();
            }
        }

        function postFail(data) {
            hideAll();
            if (mainDisplay) {
                mainDisplay.show();
            }
            alert(data.message); //temp
        }

        //Display Functions
        function loading() {
            hideAll();
            if (loadingDisplay) {
                loadingDisplay.show();
            }
        }

        function hideAll() {
            if (mainDisplay) {
                mainDisplay.hide();
            }
            if (populateFailDisplay) {
                populateFailDisplay.hide();
            }
            if (loadingDisplay) {
                loadingDisplay.hide();
            }
        }
    }
}