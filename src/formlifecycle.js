"use strict";

jsns.define("htmlrest.formlifecycle.settings", function (using) {
    var NoAnimation = using("htmlrest.noanimation");
    var typeId = using("htmlrest.typeidentifiers");

    /**
     * Settings for the form ajax lifecycle. This provides default binding names for the ajaxLifecycle.
     * Default binding names:
     * Main Display - "main"
     * Load Display - "load"
     * Fail Display - "fail"
     * @constructor
     */
    return function () {
        this.form = "form";
        this.mainDisplay = "main";
        this.loadDisplay = "load";
        this.failDisplay = "fail";
        this.animations = null;
        var self = this;

        this.getAnimations = function () {
            if (self.animations) {
                return self.animations;
            }
            return new NoAnimation();
        }

        this.getForm = function (bindings) {
            if (typeId.isString(self.form)) {
                return bindings.first(self.form);
            }
            return self.form;
        }

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
    }
});

jsns.define("htmlrest.formlifecycle", function (using) {
    var FormLifecycleSettings = using("htmlrest.formlifecycle.settings");
    var rest = using("htmlrest.rest");
    var formFuncs = using("htmlrest.form");

    /**
     * Create a simple ajax lifecyle for the form. This will show a loading screen
     * when fetching data and provides provisions to handle a data connection failure.
     * If your html uses the default bindings you don't need to pass settings.
     * @constructor
     * @param {htmlrest.component.BindingCollection} bindings - The bindings to use to lookup elements
     * @param {htmlrest.form.AjaxLifecycleSettings} [settings] - The settings for the form, optional
     */
    return function (bindings, settings) {
        if (settings === undefined) {
            settings = new FormLifecycleSettings();
        }

        var form = settings.getForm(bindings);
        var mainDisplay = settings.getMainDisplay(bindings);
        var populateFailDisplay = settings.getFailDisplay(bindings);
        var loadingDisplay = settings.getLoadDisplay(bindings);

        var animations = settings.getAnimations();

        //If no main dispaly is found use the form
        if (!mainDisplay) {
            mainDisplay = form;
        }

        //Populate
        this.populateData = function () {
            loading();
            var url = form.getAttribute('action');
            rest.get(url, getSuccess, getFail);
        }

        function getSuccess(data) {
            hideAll();
            formFuncs.populate(form, data);
            if (mainDisplay) {
                animations.show(mainDisplay);
            }
        }

        function getFail(data) {
            hideAll();
            if (populateFailDisplay) {
                animations.show(populateFailDisplay);
            }
        }

        //Submit
        form.addEventListener('submit', function (evt) {
            evt.preventDefault();
            loading();
            var url = form.getAttribute('action');
            var data = formFuncs.serialize(form);
            rest.post(url, data, postSuccess, postFail);
        });

        function postSuccess(data) {
            hideAll();
            if (mainDisplay) {
                animations.show(mainDisplay);
            }
        }

        function postFail(data) {
            hideAll();
            if (mainDisplay) {
                animations.show(mainDisplay);
            }
            alert(data.message); //temp
        }

        //Display Functions
        function loading() {
            hideAll();
            if (loadingDisplay) {
                animations.show(loadingDisplay);
            }
        }

        function hideAll() {
            if (mainDisplay) {
                animations.hide(mainDisplay);
            }
            if (populateFailDisplay) {
                animations.hide(populateFailDisplay);
            }
            if (loadingDisplay) {
                animations.hide(loadingDisplay);
            }
        }
    }
});