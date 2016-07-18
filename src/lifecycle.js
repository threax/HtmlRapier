"use strict";

(function (s) {
    htmlrest.lifecycle = htmlrest.lifecycle || {

        /**
         * Settings for a Load Display Fail lifecycle.
         * Default binding names:
         * Main Display - "main"
         * Load Display - "load"
         * Fail Display - "fail"
         * @constructor
         */
        LoadDisplayFailSettings: function(){
            this.mainDisplay = "main";
            this.failDisplay = "fail";
            this.loadDisplay = "load";
            this.animations = null;
            var self = this;

            this.getMainDisplay = function(bindings){
                if (htmlrest.isString(self.mainDisplay)) {
                    return bindings.first(self.mainDisplay);
                }
                return self.mainDisplay;
            }

            this.getLoadDisplay = function(bindings){
                if (htmlrest.isString(self.loadDisplay)) {
                    return bindings.first(self.loadDisplay);
                }
                return self.loadDisplay;
            }

            this.getFailDisplay = function(bindings){
                if (htmlrest.isString(self.failDisplay)) {
                    return bindings.first(self.failDisplay);
                }
                return self.failDisplay;
            }

            this.getAnimations = function () {
                if (self.animations) {
                    return self.animations;
                }
                return new htmlrest.animate.NoAnimations();
            }
        },

        /**
         * Create a lifecycle that shows a main display, loading display and fail message if loading fails.
         * If the defaults are acceptable you do not need to pass settings.
         * @constructor
         * @param {htmlrest.component.BindingCollection} bindings - The bindings to lookup elements from.
         * @param {htmlrest.component.LoadDisplayFailSettings} [settings] - The settings for the lifecycle, optional.
         */
        LoadDisplayFail: function (bindings, settings) {
            if(settings === undefined){
                settings = new htmlrest.lifecycle.LoadDisplayFailSettings();
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
    }
})(Sizzle);