"use strict";

jsns.define("hr.anticsrf", [
    "hr.http",
    "hr.doccookies"
],
function (exports, module, http, docCookies) {
    function activate(headerName, cookieName) {
        if (headerName === undefined) {
            headerName = 'X-XSRF-TOKEN';
        }
        if (cookieName === undefined) {
            cookieName = 'X-XSRF-TOKEN';
        }

        http.customizeRequest.add(exports, function (xhr, type) {
            var cookie = docCookies.read(cookieName);
            if (cookie) {
                xhr.setRequestHeader(headerName, cookie);
            }
        });
    }
    exports.activate = activate;
});