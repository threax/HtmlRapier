﻿"use strict";

import {EventHandler} from 'hr.eventhandler';

var customizeRequestEvent = new EventHandler();
export const customizeRequest = customizeRequestEvent.modifier;

var customizePromiseEvent = new EventHandler();
export const customizePromise = customizePromiseEvent.modifier;

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
    if (xhr.status > 199 && xhr.status < 300) {
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
export function post(url:string, data?:any) {
    return ajax(url, 'POST', data);
}

/**
 * Put data to a url. Returns a promise with the result.
 * @param {string} url - The url to put to
 * @param {object} data - The data to put
 */
export function put(url:string, data?:any) {
    return ajax(url, 'PUT', data);
}

/**
 * Delete data at a url. Returns a promise with the result.
 * @param {string} url - The url to delete to
 * @param {object} data - Data to include
 */
export function del(url:string, data?:any) {
    return ajax(url, 'DELETE', data);
}

/**
 * Get data from a url. Returns a promise with the result.
 * @param {string} url - The url to get data from
 * @param {type} [cache=false] - True to use cached results, false to always get, default false.
 */
export function get(url: string, cache?: boolean) {
    if (cache === undefined || cache === false) {
        if (url.indexOf('?') > -1) {
            url += '&';
        }
        else {
            url += '?';
        }
        url += 'noCache=' + new Date().getTime();
    }

    return setupXhr(url, 'GET', function () {
        return undefined;
    }, function () {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        return xhr;
    });
}

/**
 * A more raw ajax call if needed.
 * @param {string} url - The url to call
 * @param {string} method - The method to use
 * @param {object} data - The data to send
 */
export function ajax(url: string, method: string, data?:any) {
    return setupXhr(url, method, function () {
        return JSON.stringify(data);
    }, function () {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        return xhr;
    });
}

/**
 * Upload a file to a url
 * @param {string} url - The url to upload to
 * @param {object|FormData} data - The data to upload, if this is already form data it will be used directly, otherwise
 * data will be sent directly as a file.
 */
export function upload(url:string, data:any) {
    return setupXhr(url, 'POST', function () {
        var formData = null;

        if (data instanceof FormData) {
            formData = data;
        }
        else {
            formData = new FormData();
            formData.append('file', data);
        }

        return formData;
    }, function () {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        return xhr;
    });
}

function setupXhr(url, method, dataBuilder, xhrBuilder) {
    //Customize requests and build up promise chain for any customizations
    var customPromises = customizePromiseEvent.fire(url, method);

    //Assemble final chain
    if (customPromises === undefined || customPromises.length === 0) {
        return buildRequestPromise(url, method, dataBuilder, xhrBuilder);
    }
    else {
        return Promise.all(customPromises)
            .then(function (res) {
                return buildRequestPromise(url, method, dataBuilder, xhrBuilder);
            });
    }
}

function buildRequestPromise(url, method, dataBuilder, xhrBuilder) {
    //Build promise for request
    return new Promise(function (resolve, reject) {
        //Common xhr setup
        var xhr = xhrBuilder();
        xhr.withCredentials = true;
        customizeRequestEvent.fire(xhr, url, method);

        xhr.onload = function () {
            handleResult(xhr, resolve, reject);
        };

        var data = dataBuilder();

        if (data === undefined) {
            xhr.send();
        }
        else {
            xhr.send(data);
        }
    });
}