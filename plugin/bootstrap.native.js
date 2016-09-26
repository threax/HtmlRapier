"use strict";

jsns.run([
    "hr.toggles",
    "hr.eventhandler"
],
function(exports, module, toggles, EventHandler){

    function ModalToggle(element, next) {
        var onEventHandler = new EventHandler();
        var offEventHandler = new EventHandler();

        this.onEvent = onEventHandler.modifier;
        this.offEvent = offEventHandler.modifier;

        var modal = new Modal(element);

        element.addEventListener("hidden.bs.modal", function (evt) {
            offEventHandler.fire();
        });

        element.addEventListener("shown.bs.modal", function (evt) {
            onEventHandler.fire();
        });

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