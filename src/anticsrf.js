"use strict";

jsns.define("hr.anticsrf", [
    "hr.http",
    "hr.doccookies",
    "hr.uri"
],
function (exports, module, http, docCookies, uri) {
    function TokenInfo(headerName, requestToken) {
        this.modifyRequest = function(xhr){
            xhr.setRequestHeader(headerName, requestToken);
        }
    }

    var tokens = {};
    var needSetupRequest = true;
    function getToken(url) {
        var key = getKeyFromUrl(url);
        if (tokens[key] === undefined) {
            if(needSetupRequest){
                needSetupRequest = false;
                http.customizeRequest.add(exports, customizeRequest);
            }
            http.post(url)
            .then(function (data) {
                tokens[key] = new TokenInfo(data.headerName, data.requestToken);
            })
            .catch(function(err){
                delete tokens[key]; //Start fetch over on next request.
            });
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
            info.modifyRequest(xhr);
        }
    }
});