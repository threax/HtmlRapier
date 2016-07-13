"use strict";

(function (s) {
    htmlrest.lifecycle = htmlrest.lifecycle || {
        ajaxLoad: function (settings) {
            var animations = undefined;
            if (settings.animations) {
                animations = settings.animations;
            }
            else {
                animations = new htmlrest.animate.NoAnimations();
            }

            var mainDisplay = undefined;
            if (settings.mainDisplayQuery) {
                mainDisplay = s(settings.mainDisplayQuery)[0];
            }

            var loadingFailDisplay = undefined;
            if (settings.loadingFailDisplayQuery) {
                loadingFailDisplay = s(settings.loadingFailDisplayQuery)[0];
            }

            var loadingDisplay = undefined;
            if (settings.loadingDisplayQuery) {
                loadingDisplay = s(settings.loadingDisplayQuery)[0];
            }

            //Display Functions
            this.loading = function () {
                hideAll();
                if (loadingDisplay) {
                    animations.show(loadingDisplay);
                }
            }

            this.failed = function () {
                hideAll();
                if (loadingFailDisplay) {
                    animations.show(loadingFailDisplay);
                }
            }

            this.succeeded = function () {
                hideAll();
                if (mainDisplay) {
                    animations.show(mainDisplay);
                }
            }

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