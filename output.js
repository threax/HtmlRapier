//Output Function
htmlrest.output = new function () {
    function httpResultRunner(element, evt, sender, previousResult, runner) {
        element.html('did something');

        var errorClass = element.attr('data-class-error');
        if (errorClass) {
            if (success) {
                element.removeClass(errorClass);
            }
            else {
                element.addClass(errorClass);
            }
        }

        var successClass = element.attr('data-class-success');
        if (successClass) {
            if (success) {
                element.addClass(successClass);
            }
            else {
                element.removeClass(successClass);
            }
        }
    };

    this.httpResult = function (element) {
        return function (evt, sender, previousResult, runner) {
            httpResultRunner(element, evt, sender, previousResult, runner);
        };
    }
};