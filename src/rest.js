"use strict";

jsns.define("htmlrest.rest", null,
function (exports, module) {

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
     * Perform a post request and get a promise to the results. This is similar to using plain post, but
     * success and fail are handled by the promise returned.
     * @param {string} url - The url to post to
     * @param {object} data - The data to post
     * @returns {Promise} A promise to the response.
     */
    function postPromise(url, data) {
        return new Promise(function (resolve, reject) {
            post(url, data, resolve, reject);
        });
    }
    exports.postPromise = postPromise;

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
     * Perform a put request and get a promise to the results. This is similar to using plain put, but
     * success and fail are handled by the promise returned.
     * @param {string} url - The url to put to
     * @param {object} data - The data to put
     * @returns {Promise} A promise to the response.
     */
    function putPromise(url, data) {
        return new Promise(function (resolve, reject) {
            put(url, data, resolve, reject);
        });
    }
    exports.putPromise = putPromise;

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
     * Perform a delete request and get a promise to the results. This is similar to using plain delete, but
     * success and fail are handled by the promise returned.
     * @param {string} url - The url to delete to
     * @param {object} data - Data to include
     * @returns {Promise} A promise to the response.
     */
    function delPromise(url, data) {
        return new Promise(function (resolve, reject) {
            del(url, data, resolve, reject);
        });
    }
    exports.delPromise = delPromise;

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
     * Perform a get request and get a promise to the results. This is similar to using plain get, but
     * success and fail are handled by the promise returned.
     * @param {type} url - The url to get data from
     * @param {type} cache - True to use cached results, false to always get, default false.
     * @returns {Promise} A promise to the response.
     */
    function getPromise(url, cache) {
        return new Promise(function (resolve, reject) {
            get(url, resolve, reject, cache);
        });
    }
    exports.getPromise = getPromise;

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
     * Perform an ajax request and get a promise to the results. This is similar to using plain ajax, but
     * success and fail are handled by the promise returned.
     * @param {string} url - The url to call
     * @param {string} method - The method to use
     * @param {object} data - The data to send
     * @returns {Promise} A promise to the response.
     */
    function ajaxPromise(url, method, data) {
        return new Promise(function (resolve, reject) {
            ajax(url, method, data, resolve, reject);
        });
    }
    exports.ajaxPromise = ajaxPromise;

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

    /**
     * Perform an upload request and get a promise to the results. This is similar to using plain upload, but
     * success and fail are handled by the promise returned.
     * @param {string} url - The url to call
     * @param {object} data - The data to send
     * @returns {Promise} A promise to the response.
     */
    function uploadPromise(url, data) {
        return new Promise(function (resolve, reject) {
            upload(url, data, resolve, reject);
        });
    }
    exports.uploadPromise = uploadPromise;
});