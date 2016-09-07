"use strict";

jsns.define("hr.anticsrf", [
    "hr.http",
    "hr.doccookies",
    "hr.uri"
],
function (exports, module, http, docCookies, uri) {
    function activate(host, headerName, cookieName) {
        if (headerName === undefined) {
            headerName = 'X-XSRF-TOKEN';
        }
        if (cookieName === undefined) {
            cookieName = 'X-XSRF-TOKEN';
        }
        if (host !== undefined) {
            var hostUri = uri.parseUri(host);
            host = hostUri.authority.toLowerCase();
        }

        http.customizeRequest.add(exports, function (xhr, url, type) {
            modifyRequest(host, xhr, url, type, headerName, cookieName);
        });
    }
    exports.activate = activate;

    function modifyRequest(host, xhr, url, type, headerName, cookieName) {
        if (host === undefined || host === uri.parseUri(url).authority.toLowerCase()) {
            var cookie = docCookies.read(cookieName);
            if (cookie) {
                xhr.setRequestHeader(headerName, cookie);
            }
        }
    }
});