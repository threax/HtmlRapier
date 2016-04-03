var htmlrest = htmlrest || {};
htmlrest.classes = htmlrest.classes || {};
//Output Functions

htmlrest.classes.output = function() {
    
};

htmlrest.classes.output.prototype.httpResult = function (outputElement, jqXHR) {
    //outputElement.html(data.message);

    var errorClass = outputElement.attr('data-class-error');
    if (errorClass) {
        if (success) {
            outputElement.removeClass(errorClass);
        }
        else {
            outputElement.addClass(errorClass);
        }
    }

    var successClass = outputElement.attr('data-class-success');
    if (successClass) {
        if (success) {
            outputElement.addClass(successClass);
        }
        else {
            outputElement.removeClass(successClass);
        }
    }
};

htmlrest.classes.output.prototype.httpResultSuccessHandler = 

htmlrest.output = new htmlrest.classes.output();

//Form Functions
htmlrest.classes.form = function () {

    
};

htmlrest.classes.form.prototype.submit = function (form) {
    var outputElement = $(form.attr('data-output'));
    $.ajax({
        method: form.attr('method'),
        url: form.attr('action'),
        data: form.serialize(),
        success: function (data, textStatus, jqXHR) {
            htmlrest.output.httpResult(outputElement, jqXHR);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            htmlrest.output.httpResult(outputElement, jqXHR);
        }
    });
};

htmlrest.classes.form.prototype.submitHandler = function (evt) {
    htmlrest.form.submit($(this));
    return false;
}

htmlrest.form = new htmlrest.classes.form();