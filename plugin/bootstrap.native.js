"use strict";

jsns.run([
    "hr.toggles"
],
function(exports, module, toggles){

    function ModalToggle(element, next) {
        var modal = new Modal(element);

        function on() {
            modal.open();
            return next;
        }
        this.on = on;

        function off() {
            modal.close();
            return next;
        }
        this.off = off;

        function applyState(style) {
            return next;
        }
        this.applyState = applyState;
    }

    toggles.addTogglePlugin(function (element, states, toggle) {
        if (element.classList.contains('modal')) {
            toggle = new ModalToggle(element, toggle);
        }

        return toggle;
    });
});