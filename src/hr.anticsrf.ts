import * as http from 'hr.http';
import * as docCookies from 'hr.cookies';
import * as uri from 'hr.uri';

function TokenInfo(tokenUrl) {
    var headerName;
    var requestToken;
    var delayedRequestPromises;

    http.post(tokenUrl)
        .then(function (data:any) {
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
export function getToken(url) {
    var key = getKeyFromUrl(url);
    if (tokens[key] === undefined) {
        if (needSetupRequest) {
            needSetupRequest = false;
            http.customizeRequest.add(null, customizeRequest);
            http.customizePromise.add(null, customizePromise)
        }
        tokens[key] = new TokenInfo(url);
    }
}

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