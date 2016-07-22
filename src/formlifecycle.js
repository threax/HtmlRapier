"use strict";

jsns.define("htmlrest.formlifecycle", function (using) {
    var toggles = using("htmlrest.toggles");
    var rest = using("htmlrest.rest");

    /**
     * Create a simple ajax lifecyle for the form. This will show a loading screen
     * when fetching data and provides provisions to handle a data connection failure.
     * If your html uses the default bindings you don't need to pass settings.
     * @constructor
     * @param {htmlrest.component.BindingCollection} bindings - The bindings to use to lookup elements
     * @param {htmlrest.form.AjaxLifecycleSettings} [settings] - The settings for the form, optional
     */
    return function (bindings) {
        var tryAgainFunc = null;
        var self = this;

        bindings.setListener({
            submit: function (evt) {
                evt.preventDefault();
                self.submit();
            },
            tryAgain: function (evt) {
                evt.preventDefault();
                tryAgainFunc();
            }
        });

        var load = bindings.getToggle('load');
        var main = bindings.getToggle('main');
        var fail = bindings.getToggle('fail');
        var formToggler = new toggles.group(load, main, fail);

        var settingsModel = bindings.getModel('settings');

        this.populate = function () {
            formToggler.show(load);
            rest.get(settingsModel.getSrc(),
                function (successData) {
                    settingsModel.setData(successData);
                    formToggler.show(main);
                },
                function (failData) {
                    tryAgainFunc = self.populate;
                    formToggler.show(fail);
                });
        }

        this.submit = function() {
            formToggler.show(load);
            var data = settingsModel.getData();
            rest.post(settingsModel.getSrc(), data,
                function (successData) {
                    formToggler.show(main);
                },
                function (failData) {
                    tryAgainFunc = self.submit;
                    formToggler.show(fail);
                });
        }
    }
});