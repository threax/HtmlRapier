"use strict";

jsns.define("htmlrest.noanimation", function (using) {
    /**
     * An animator that directly changes styles by changing display type on the element between "none" and ""
     */
    var exports = function () {

    }

    /**
     * Show the passed element.
     * @param {HTMLElement} element - The element to show
     */
    exports.prototype.show = function (element) {
        element.style.display = "";
    }

    /**
     * Hide the passed element.
     * @param {HTMLElement} element - The element to hide
     */
    exports.prototype.hide = function (element) {
        element.style.display = "none";
    }

    return exports;
});