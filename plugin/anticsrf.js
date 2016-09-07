"use strict";

jsns.run([
    "hr.http",
    "hr.doccookies"
],
function (exports, module, http, docCookies) {
    var headerName = 'X-XSRF-TOKEN';
    var cookieName = 'X-XSRF-TOKEN';

    function setHeaderName(value) {
        headerName = value;
    }
    exports.setHeaderName = setHeaderName;

    http.customizeRequest.add(exports, function (xhr, type) {
        xhr.setRequestHeader(headerName, docCookies.read(cookieName));
    });
});