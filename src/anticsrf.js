"use strict";

jsns.define("hr.anticsrf", [
    "hr.http",
    "hr.doccookies",
    "hr.uri"
],
function (exports, module, http, docCookies, uri) {
    function TokenInfo(tokenUrl) {
        var headerName;
        var requestToken;
        var delayedRequestPromises;

        ////Remove this delay
        //new Promise(function (resolve, reject) {
        //    setTimeout(function () {
        //        resolve('woot');
        //    }, 10000);
        //})
        //.then(function (data) {
            //return 
        http.post(tokenUrl)
        //})
        .then(function (data) {
            headerName = data.headerName;
            requestToken = data.requestToken;

            if (delayedRequestPromises !== undefined) {
                for (var i = 0; i < delayedRequestPromises.length; ++delayedRequestPromises) {
                    delayedRequestPromises[i].resolve();
                }
            }
        })
        .catch(function (err) {
            if (delayedRequestPromises !== undefined) {
                for (var i = 0; i < delayedRequestPromises.length; ++delayedRequestPromises) {
                    delayedRequestPromises[i].reject();
                }
            }
        });

        this.modifyPromise = function (url, type) {
            if (headerName === undefined) {
                if (url !== tokenUrl) {
                    if (delayedRequestPromises === undefined) {
                        delayedRequestPromises = [];
                    }
                    return new Promise(function (resolve, reject) {
                        delayedRequestPromises.push({
                            resolve: resolve,
                            reject: reject
                        });
                    });
                }
            }
        }

        this.modifyRequest = function (xhr, url, type) {
            if (url !== tokenUrl) {
                xhr.setRequestHeader(headerName, requestToken);
            }
        }
    }

    var tokens = {};
    var needSetupRequest = true;
    function getToken(url) {
        var key = getKeyFromUrl(url);
        if (tokens[key] === undefined) {
            if (needSetupRequest) {
                needSetupRequest = false;
                http.customizeRequest.add(exports, customizeRequest);
                http.customizePromise.add(exports, customizePromise)
            }
            tokens[key] = new TokenInfo(url);
        }
    }
    exports.getToken = getToken;

    function getKeyFromUrl(url) {
        return uri.parseUri(url).authority.toLowerCase();
    }

    function customizePromise(url, type) {
        var key = getKeyFromUrl(url);
        var info = tokens[key];
        if (info !== undefined) {
            return info.modifyPromise(url, type);
        }
    }

    function customizeRequest(xhr, url, type) {
        var key = getKeyFromUrl(url);
        var info = tokens[key];
        if (info !== undefined) {
            info.modifyRequest(xhr, url, type);
        }
    }
});