//Rest Functions
htmlrest.event.prototype.rest = function () { }

htmlrest.event.prototype.rest.prototype.post = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.post.prototype.runner(url, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.post.prototype.runner = function (url, evt, sender, previousResult, runner) {
    $.ajax({
        method: 'post',
        url: previousResult,
        data: data,
        success: function (retData, textStatus, jqXHR) {
            runner.next({ data: retData, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
}

htmlrest.event.prototype.rest.prototype.put = function (url) {
    return function (evt, sender, previousResult, runner) {
        htmlrest.event.prototype.rest.prototype.put.prototype.runner(url, evt, sender, previousResult, runner);
    }
}

htmlrest.event.prototype.rest.prototype.put.prototype.runner = function (url, evt, sender, previousResult, runner) {
    $.ajax({
        method: 'put',
        url: url,
        data: previousResult,
        success: function (retData, textStatus, jqXHR) {
            runner.next({ data: retData, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
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
    $.ajax({
        method: method,
        url: url,
        data: previousResult,
        success: function (data, textStatus, jqXHR) {
            runner.next({ data: data, jqXHR: jqXHR, success: true });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            runner.next({ data: jqXHR.data, jqXHR: jqXHR, success: false });
        }
    });
}

htmlrest.rest = new htmlrest.event.prototype.rest();