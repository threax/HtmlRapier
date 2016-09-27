jsns.define("swagger", [
    "hr.http"
],
function (exports, module, http) {
    "use strict";

    if (window.SwaggerClient !== undefined) {
        exports.SwaggerClient = window.SwaggerClient;
        exports.Client = window.SwaggerClient;
    }
});