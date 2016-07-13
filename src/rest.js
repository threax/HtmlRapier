(function () {
    function handleResult(xhr, success, fail) {
        if (xhr.status === 200) {
            if (success !== undefined) {
                var data = undefined;
                try {
                    data = JSON.parse(xhr.response);
                }
                catch (err) { }
                success(data);
            }
        }
        else {
            if (fail !== undefined) {
                try {
                    data = JSON.parse(xhr.response);
                }
                catch (err) { }
                fail(data);
            }
        }
    }

    //Rest Functions
    htmlrest.rest = htmlrest.rest || {

    }

    htmlrest.rest.post = function (url, data, success, fail) {
        htmlrest.rest.ajax(url, 'POST', data, success, fail);
    }

    htmlrest.rest.put = function (url, data, success, fail) {
        htmlrest.rest.ajax(url, 'PUT', data, success, fail);
    }

    htmlrest.rest.delete = function (url, data, success, fail) {
        htmlrest.rest.ajax(url, 'DELETE', data, success, fail);
    }

    htmlrest.rest.get = function (url, success, fail, cache) {
        if (fail === undefined) {
            fail = success;
        }
        if (cache === undefined || cache === false) {
            if (url.indexOf('?') > -1) {
                url += '&';
            }
            else {
                url += '?';
            }
            url += 'noCache=' + new Date().getTime();
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function () {
            handleResult(xhr, success, fail);
        };
        xhr.send();
    }

    htmlrest.rest.ajax = function (url, method, data, success, fail) {
        if (fail === undefined) {
            fail = success;
        }

        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            handleResult(xhr, success, fail);
        };
        xhr.send(JSON.stringify(data));
    }

    htmlrest.rest.upload = function (url, data, success, fail) {
        if (fail === undefined) {
            fail = success;
        }

        var formData = null;

        if (data instanceof FormData) {
            formData = data;
        }
        else {
            formData = new FormData();
            formData.append('file', data);
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.onload = function () {
            handleResult(xhr, success, fail);
        };
        xhr.send(formData);
    }
})();