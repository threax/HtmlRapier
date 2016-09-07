"use strict";

jsns.define("hr.http", ["hr.eventhandler"],
function (exports, module, EventHandler) {

    var customizeRequestEvent = new EventHandler();
    exports.customizeRequest = customizeRequestEvent.modifier;

    function extractData(xhr) {
        var data;
        var contentType = xhr.getResponseHeader('content-type');
        if (contentType && contentType.search(/application\/json/) !== -1) {
            try {
                data = JSON.parse(xhr.response);
            }
            catch (err) {
                data = xhr.response;
            }
        }
        else {
            data = xhr.response;
        }
        return data;
    }

    //Helper function to handle results
    function handleResult(xhr, success, fail) {
        if (xhr.status === 200) {
            if (success !== undefined) {
                success(extractData(xhr));
            }
        }
        else {
            if (fail !== undefined) {
                fail(extractData(xhr));
            }
        }
    }

    /**
     * Post data to a url. Returns a promise to get the result.
     * @param {string} url - The url to post to
     * @param {object} data - The data to post
     */
    function post(url, data) {
        return ajax(url, 'POST', data);
    }
    exports.post = post;

    /**
     * Put data to a url. Returns a promise with the result.
     * @param {string} url - The url to put to
     * @param {object} data - The data to put
     */
    function put(url, data, success, fail) {
        return ajax(url, 'PUT', data);
    }
    exports.put = put;

    /**
     * Delete data at a url. Returns a promise with the result.
     * @param {string} url - The url to delete to
     * @param {object} data - Data to include
     */
    function del(url, data, success, fail) {
        ajax(url, 'DELETE', data);
    }
    exports.delete = del;

    /**
     * Get data from a url. Returns a promise with the result.
     * @param {string} url - The url to get data from
     * @param {type} [cache=false] - True to use cached results, false to always get, default false.
     */
    function get(url, cache) {
        if (cache === undefined || cache === false) {
            if (url.indexOf('?') > -1) {
                url += '&';
            }
            else {
                url += '?';
            }
            url += 'noCache=' + new Date().getTime();
        }

        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onload = function () {
                handleResult(xhr, resolve, reject);
            };
            customizeRequestEvent.fire(xhr, 'GET');
            xhr.send();
        });
    }
    exports.get = get;

    /**
     * A more raw ajax call if needed.
     * @param {string} url - The url to call
     * @param {string} method - The method to use
     * @param {object} data - The data to send
     */
    function ajax(url, method, data) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                handleResult(xhr, resolve, reject);
            };
            customizeRequestEvent.fire(xhr, method);
            xhr.send(JSON.stringify(data));
        });
    }
    exports.ajax = ajax;

    /**
     * Upload a file to a url
     * @param {string} url - The url to upload to
     * @param {object|FormData} data - The data to upload, if this is already form data it will be used directly, otherwise
     * data will be sent directly as a file.
     */
    function upload(url, data) {
        var formData = null;

        if (data instanceof FormData) {
            formData = data;
        }
        else {
            formData = new FormData();
            formData.append('file', data);
        }

        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.onload = function () {
                handleResult(xhr, resolve, reject);
            };
            customizeRequestEvent.fire(xhr, 'POST');
            xhr.send(formData);
        });
    }
    exports.upload = upload;
});