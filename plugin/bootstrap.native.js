"use strict";

//jsns.define("bootstrap.native", function (using, exports, module) {
//    module.exports = {};
//});

jsns.run(function (using) {
    using("htmlrest.toggles");
    //using("bootstrap.native");
},
function(exports, module, toggles){

    function ModalToggle(element, next) {
        var modal = new Modal(element);

        this.on = function () {
            modal.open();
            if (next) {
                next.on();
            }
        }

        this.off = function () {
            modal.close();
            if (next) {
                next.off();
            }
        }
    }

    toggles.addTogglePlugin(function (element, toggle) {
        if (element.classList.contains('modal')) {
            toggle = new ModalToggle(element, toggle);
        }

        return toggle;
    });
});