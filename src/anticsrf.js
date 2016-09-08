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

        new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve('woot');
            }, 10000);
        })
        .then(function (data) {
            return http.post(tokenUrl);
        })
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

        this.modifyRequest = function (xhr, url, type) {
            if (headerName !== undefined) {
                xhr.setRequestHeader(headerName, requestToken);
            }
            else {
                if (url !== tokenUrl) {
                    if (delayedRequestPromises === undefined) {
                        delayedRequestPromises = [];
                    }
                    return new Promise(function (resolve, reject) {
                        delayedRequestPromises.push({
                            resolve: resolve,
                            reject: reject
                        });
                    })
                    .then(function (data) {
                        alert('started request mod');
                        xhr.setRequestHeader(headerName, requestToken);
                        alert('delay modified request');
                    });
                }
            }
        }
    }

    var tokens = {
    };
    var needSetupRequest = true;
    function getToken(url) {
        var key = getKeyFromUrl(url);
        if (tokens[key] === undefined) {
            if (needSetupRequest) {
                needSetupRequest = false;
                http.customizeRequest.add(exports, customizeRequest);
            }
            tokens[key] = new TokenInfo(url);
        }
    }
    exports.getToken = getToken;

    function getKeyFromUrl(url) {
        return uri.parseUri(url).authority.toLowerCase();
    }

    function customizeRequest(xhr, url, type) {
        var key = getKeyFromUrl(url);
        var info = tokens[key];
        if (info !== undefined) {
            return info.modifyRequest(xhr, url, type);
        }
    }
});