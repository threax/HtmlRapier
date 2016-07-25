"use strict";

jsns.define("htmlrest.toggles", [
    "htmlrest.typeidentifiers"
],
function(exports, module, typeId){

    var togglePlugins = [];

    /**
     * Add a toggle plugin that can create additional items on the toggle chain.
     * @param {type} plugin
     */
    function addTogglePlugin(plugin) {
        togglePlugins.push(plugin);
    }
    exports.addTogglePlugin = addTogglePlugin;

    /**
     * A simple toggler that does nothing. Used to shim correctly if no toggles are defined for a toggle element.
     */
    function NullToggle(next) {
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
    exports.NullToggle = NullToggle;

    /**
     * A toggler that toggles style for an element
     */
    function StyleToggle(element, onStyle, offStyle, next) {
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
    function ClassToggle(element, onClass, offClass, idleClass, next) {
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

    function Group() {
        var toggles = arguments;

        this.add = function (toggle) {
            toggles.push(toggle);
        }

        this.show = function (toggle) {
            for (var i = 0; i < toggles.length; ++i) {
                toggles[i].off();
            }
            toggle.on();
        }
    }
    exports.Group = Group;

    function build(element) {
        //Not many of these so just search for everything
        var onStyle = element.getAttribute('data-hr-style-on');
        var offStyle = element.getAttribute('data-hr-style-off');
        var onClass = element.getAttribute('data-hr-class-on');
        var offClass = element.getAttribute('data-hr-class-off');
        var idleClass = element.getAttribute('data-hr-class-idle');
        var toggle = null;

        if (onStyle || offStyle) {
            toggle = new StyleToggle(element, onStyle, offStyle, toggle);
        }

        if (onClass || offClass) {
            toggle = new ClassToggle(element, onClass, offClass, idleClass, toggle);
        }

        //Now toggle plugin chain
        for (var i = 0; i < togglePlugins.length; ++i) {
            toggle = togglePlugins[i](element, toggle);
        }

        //If we get all the way here with no toggle, use the null toggle.
        if (toggle === null) {
            toggle = new NullToggle(toggle);
        }

        return toggle;
    }
    exports.build = build;

    /**
     * Determine if a given toggle is a null toggle.
     * @param toggle - the toggle to check
     * @returns {type} - True if toggle is a NullToggle
     */
    function isNullToggle(toggle) {
        return typeId.isObject(toggle) && typeId.constructor.prototype == NullToggle.prototype;
    }
    exports.isNullToggle = isNullToggle;
});