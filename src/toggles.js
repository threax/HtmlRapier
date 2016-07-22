"use strict";

jsns.define("htmlrest.toggles", function (using) {
    var exports = {};
    
    /**
     * A simple toggler that does nothing. Used to shim correctly if no toggles are defined for a toggle element.
     */
    exports.NullToggle = function (next) {
        this.on = function () {
            if (next) {
                next.on();
            }
        }

        this.off = function () {
            if (next) {
                next.off();
            }
        }
    }

    /**
     * A toggler that toggles style for an element
     */
    exports.StyleToggle = function (element, onStyle, offStyle, next) {
        onStyle = onStyle || "";
        offStyle = offStyle || "";

        var originalStyles = element.style.cssText || "";

        this.on = function () {
            element.style.cssText = originalStyles + onStyle;
            if (next) {
                next.on();
            }
        }

        this.off = function () {
            element.style.cssText = originalStyles + offStyle;
            if (next) {
                next.off();
            }
        }
    }

    /**
     * A toggler that toggles classes for an element
     */
    exports.ClassToggle = function (element, onClass, offClass, idleClass, next) {
        onClass = onClass || "";
        offClass = offClass || "";

        var originalClasses = element.getAttribute("class") || "";

        this.on = function () {
            element.setAttribute("class", originalClasses + ' ' + onClass);
            startAnimation();
            if (next) {
                next.on();
            }
        }

        this.off = function () {
            element.setAttribute("class", originalClasses + ' ' + offClass);
            startAnimation();
            if (next) {
                next.off();
            }
        }

        function startAnimation() {
            if (idleClass) {
                element.classList.remove(idleClass);
                element.removeEventListener('transitionend', stopAnimation);
                element.removeEventListener('animationend', stopAnimation);
                element.addEventListener('transitionend', stopAnimation);
                element.addEventListener('animationend', stopAnimation);
            }
        }

        function stopAnimation() {
            element.removeEventListener('transitionend', stopAnimation);
            element.removeEventListener('animationend', stopAnimation);
            element.classList.add(idleClass);
        }
    }

    exports.group = function () {
        var toggles = arguments;

        this.add = function(toggle){
            toggles.push(toggle);
        }

        this.show = function(toggle){
            for (var i = 0; i < toggles.length; ++i) {
                toggles[i].off();
            }
            toggle.on();
        }
    }

    exports.build = function(element){
        //Not many of these so just search for everything
        var onStyle = element.getAttribute('data-hr-style-on');
        var offStyle = element.getAttribute('data-hr-style-off');
        var onClass = element.getAttribute('data-hr-class-on');
        var offClass = element.getAttribute('data-hr-class-off');
        var idleClass = element.getAttribute('data-hr-class-idle');
        var toggle = null;

        if (onStyle || offStyle) {
            toggle = new exports.StyleToggle(element, onStyle, offStyle, toggle);
        }

        if (onClass || offClass) {
            toggle = new exports.ClassToggle(element, onClass, offClass, idleClass, toggle);
        }

        //If we get all the way here with no toggle, use the null toggle.
        if (toggle === null) {
            toggle = new exports.NullToggle(toggle);
        }

        return toggle;
    }

    return exports;
});