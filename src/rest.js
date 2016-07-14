(function () {
    //Helper function to handle results
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

    /**
     * This callback is called when server communication has occured.
     * @callback htmlrest.rest~resultCallback
     * @param {object} data - The data result from the server.
     */

    /**
     * Post data to a url. Success and fail called depending on result
     * @param {string} url - The url to post to
     * @param {object} data - The data to post
     * @param {htmlrest.rest~resultCallback} success - Called if the operation is successful
     * @param {htmlrest.rest~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
    htmlrest.rest.post = function (url, data, success, fail) {
        htmlrest.rest.ajax(url, 'POST', data, success, fail);
    }

    /**
     * Put data to a url. Success and fail called depending on result
     * @param {string} url - The url to put to
     * @param {object} data - The data to put
     * @param {htmlrest.rest~resultCallback} success - Called if the operation is successful
     * @param {htmlrest.rest~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
    htmlrest.rest.put = function (url, data, success, fail) {
        htmlrest.rest.ajax(url, 'PUT', data, success, fail);
    }

    /**
     * Delete data at a url. Success and fail called depending on result
     * @param {string} url - The url to delete to
     * @param {object} data - Data to include
     * @param {htmlrest.rest~resultCallback} success - Called if the operation is successful
     * @param {htmlrest.rest~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
    htmlrest.rest.delete = function (url, data, success, fail) {
        htmlrest.rest.ajax(url, 'DELETE', data, success, fail);
    }

    /**
     * Get data from a url. Success and fail called depending on result
     * @param {string} url - The url to get data from
     * @param {htmlrest.rest~resultCallback} success - Called if the operation is successful
     * @param {htmlrest.rest~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     * @param {type} [cache=false] - True to use cached results, false to always get, default false.
     */
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

    /**
     * A more raw ajax call if needed.
     * @param {string} url - The url to call
     * @param {string} method - The method to use
     * @param {object} data - The data to send
     * @param {htmlrest.rest~resultCallback} success - Called if the operation is successful
     * @param {htmlrest.rest~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
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

    /**
     * Upload a file to a url
     * @param {string} url - The url to upload to
     * @param {object|FormData} data - The data to upload, if this is already form data it will be used directly, otherwise
     * data will be sent directly as a file.
     * @param {htmlrest.rest~resultCallback} success - Called if the operation is successful
     * @param {htmlrest.rest~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
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