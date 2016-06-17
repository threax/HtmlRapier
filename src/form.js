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
    }
}