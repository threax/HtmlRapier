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

    function safeApplyState(toggle, name) {
        if (toggle) {
            var func = toggle[name];
            if (func) {
                func();
            }
            else {
                var next = toggle.applyState(null);
                safeApplyState(next, name);
            }
        }
    }

    function ToggleState(name, value, toggle) {
        function activate() {
            var next = toggle.applyState(value);
            safeApplyState(next, name);
        }

        return activate;
    }

    function addState(toggle, name, value) {
        toggle[name] = ToggleState(name, value, toggle);
    }

    /**
     * A simple toggler that does nothing. Used to shim correctly if no toggles are defined for a toggle element.
     */
    function NullToggle(next) {
        function applyState(value) {
            return next;
        }
        this.applyState = applyState;
    }
    exports.NullToggle = NullToggle;

    /**
     * A toggler that toggles style for an element
     */
    function StyleToggle(element, next) {
        var originalStyles = element.style.cssText || "";

        function applyState(style) {
            if (style) {
                element.style.cssText = originalStyles + style;
            }
            else {
                element.style.cssText = originalStyles;
            }
            return next;
        }
        this.applyState = applyState;
    }

    /**
    * A toggler that toggles classes for an element
    */
    function ClassToggle(element, idleClass, next) {
        var originalClasses = element.getAttribute("class") || "";

        function applyState(classes) {
            if (classes) {
                element.setAttribute("class", originalClasses + ' ' + classes);
            }
            else {
                element.setAttribute("class", originalClasses);
            }
            startAnimation();
            return next;
        }
        this.applyState = applyState;

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

        function add(toggle) {
            toggles.push(toggle);
        }
        this.add = add;

        function show(toggle, showState, hideState) {
            if (showState === undefined) {
                showState = 'on';
            }

            if (hideState === undefined) {
                hideState = 'off';
            }

            for (var i = 0; i < toggles.length; ++i) {
                safeApplyState(toggles[i], hideState);
            }
            safeApplyState(toggle, showState);
        }
        this.show = show;
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
            toggle = new StyleToggle(element, toggle);
            addState(toggle, "on", onStyle);
            addState(toggle, "off", offStyle);
        }

        if (onClass || offClass) {
            toggle = new ClassToggle(element, idleClass, toggle);
            addState(toggle, "on", onClass);
            addState(toggle, "off", offClass);
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
        return typeId.isObject(toggle) && toggle.constructor.prototype == NullToggle.prototype;
    }
    exports.isNullToggle = isNullToggle;
});