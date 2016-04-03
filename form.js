//Form Functions
//htmlrest.classes.form = function () {
//    
//};

htmlrest.form = new function () {
    function submitRunner(form, evt, sender, previousResult, runner) {
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

    this.submit = function (form) {
        return function (evt, sender, previousResult, runner) {
            submitRunner(form, evt, sender, previousResult, runner);
        }
    }

    this.submitSelf = function () {
        return function (evt, sender, previousResult, runner) {
            submitRunner(sender, evt, sender, previousResult, runner);
        }
    }
}

//htmlrest.form = new htmlrest.classes.form();