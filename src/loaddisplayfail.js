"use strict";

jsns.define("htmlrest.loaddisplayfail.settings", function (using) {
    var NoAnimation = using("htmlrest.noanimation");
    var typeId = using("htmlrest.typeidentifiers");

    return function () {
        this.mainDisplay = "main";
        this.failDisplay = "fail";
        this.loadDisplay = "load";
        this.animations = null;
        var self = this;

        this.getMainDisplay = function (bindings) {
            if (typeId.isString(self.mainDisplay)) {
                return bindings.first(self.mainDisplay);
            }
            return self.mainDisplay;
        }

        this.getLoadDisplay = function (bindings) {
            if (typeId.isString(self.loadDisplay)) {
                return bindings.first(self.loadDisplay);
            }
            return self.loadDisplay;
        }

        this.getFailDisplay = function (bindings) {
            if (typeId.isString(self.failDisplay)) {
                return bindings.first(self.failDisplay);
            }
            return self.failDisplay;
        }

        this.getAnimations = function () {
            if (self.animations) {
                return self.animations;
            }
            return new NoAnimation();
        }
    };
});

jsns.define("htmlrest.loaddisplayfail", function (using) {
    var LoadDisplayFailSettings = using("htmlrest.loaddisplayfail.settings");

    return function (bindings, settings) {
        if (settings === undefined) {
            settings = new LoadDisplayFailSettings();
        }

        var animations = settings.getAnimations();

        var mainDisplay = settings.getMainDisplay(bindings);
        var loadingFailDisplay = settings.getFailDisplay(bindings);
        var loadingDisplay = settings.getLoadDisplay(bindings);

        /**
         * Set the lifecycle to loading.
         */
        this.loading = function () {
            hideAll();
            if (loadingDisplay) {
                animations.show(loadingDisplay);
            }
        }

        /**
         * Set the lifecycle to failed.
         */
        this.failed = function () {
            hideAll();
            if (loadingFailDisplay) {
                animations.show(loadingFailDisplay);
            }
        }

        /**
         * Set the lifecycle to succeeded.
         */
        this.succeeded = function () {
            hideAll();
            if (mainDisplay) {
                animations.show(mainDisplay);
            }
        }

        /**
         * Hide all form elements.
         */
        function hideAll() {
            if (mainDisplay) {
                animations.hide(mainDisplay);
            }
            if (loadingFailDisplay) {
                animations.hide(loadingFailDisplay);
            }
            if (loadingDisplay) {
                animations.hide(loadingDisplay);
            }
        }
    }
});