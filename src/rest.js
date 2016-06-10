//Rest Functions
htmlrest.event.prototype.rest = function () { }

htmlrest.event.prototype.rest.prototype.post = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.ajax.prototype.runner(url, 'post', evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.put = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.ajax.prototype.runner(url, 'put', evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.delete = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.ajax.prototype.runner(url, 'delete', evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.get = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.get.prototype.runner(url, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.get.prototype.runner = function (url, evt, sender, previousResult, runner) {
    $.ajax({
        method: 'get',
        url: url,
        cache: false,
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
}

htmlrest.event.prototype.rest.prototype.ajax = function (url, method) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.ajax.prototype.runner(url, method, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.ajax.prototype.runner = function (url, method, evt, sender, previousResult, runner) {
    var request = {
        method: method,
        url: url,
        contentType: 'application/json; charset=UTF-8',
        data: JSON.stringify(previousResult),
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    };

    $.ajax(request);
}

htmlrest.event.prototype.rest.prototype.upload = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.upload.prototype.runner(url, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.upload.prototype.runner = function (url, evt, sender, previousResult, runner) {
    var formData = new FormData();
    formData.append('file', previousResult);

    var request = {
        method: 'post',
        url: url,
        contentType: false,
        processData: false,
        data: formData,
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    };

    $.ajax(request);
}

htmlrest.rest = new htmlrest.event.prototype.rest();