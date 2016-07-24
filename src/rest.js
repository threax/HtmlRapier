"use strict";

jsns.define("htmlrest.rest", function (using) {},
function(exports, module){
    //Helper function to handle results
    function handleResult(xhr, success, fail) {
        if (xhr.status === 200) {
            if (success !== undefined) {
                var data = undefined;
                try {
                    data = JSON.parse(xhr.response);
                }
                catch (err) {
                    data = xhr.response;
                }
                success(data);
            }
        }
        else {
            if (fail !== undefined) {
                try {
                    data = JSON.parse(xhr.response);
                }
                catch (err) {
                    data = xhr.response;
                }
                fail(data);
            }
        }
    }

    /**
     * This callback is called when server communication has occured.
     * @callback exports~resultCallback
     * @param {object} data - The data result from the server.
     */

    /**
     * Post data to a url. Success and fail called depending on result
     * @param {string} url - The url to post to
     * @param {object} data - The data to post
     * @param {exports~resultCallback} success - Called if the operation is successful
     * @param {exports~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
    function post(url, data, success, fail) {
        ajax(url, 'POST', data, success, fail);
    }
    exports.post = post;

    /**
     * Put data to a url. Success and fail called depending on result
     * @param {string} url - The url to put to
     * @param {object} data - The data to put
     * @param {exports~resultCallback} success - Called if the operation is successful
     * @param {exports~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
    function put(url, data, success, fail) {
        ajax(url, 'PUT', data, success, fail);
    }
    exports.put = put;

    /**
     * Delete data at a url. Success and fail called depending on result
     * @param {string} url - The url to delete to
     * @param {object} data - Data to include
     * @param {exports~resultCallback} success - Called if the operation is successful
     * @param {exports~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
    function del(url, data, success, fail) {
        ajax(url, 'DELETE', data, success, fail);
    }
    exports.delete = del;

    /**
     * Get data from a url. Success and fail called depending on result
     * @param {string} url - The url to get data from
     * @param {exports~resultCallback} success - Called if the operation is successful
     * @param {exports~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     * @param {type} [cache=false] - True to use cached results, false to always get, default false.
     */
    function get(url, success, fail, cache) {
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
    exports.get = get;

    /**
     * A more raw ajax call if needed.
     * @param {string} url - The url to call
     * @param {string} method - The method to use
     * @param {object} data - The data to send
     * @param {exports~resultCallback} success - Called if the operation is successful
     * @param {exports~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
    function ajax(url, method, data, success, fail) {
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
    exports.ajax = ajax;

    /**
     * Upload a file to a url
     * @param {string} url - The url to upload to
     * @param {object|FormData} data - The data to upload, if this is already form data it will be used directly, otherwise
     * data will be sent directly as a file.
     * @param {exports~resultCallback} success - Called if the operation is successful
     * @param {exports~resultCallback} [fail] - Called if the operation fails, if not provided will call success for this.
     */
    function upload(url, data, success, fail) {
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
    exports.upload = upload;
});