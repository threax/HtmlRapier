﻿"use strict";

jsns.define("hr.formlifecycle", [
    "hr.toggles",
    "hr.http"
],
function (exports, module, toggles, http) {

    /**
     * Create a simple ajax lifecyle for the form. This will show a loading screen
     * when fetching data and provides provisions to handle a data connection failure.
     * If your html uses the default bindings you don't need to pass settings.
     * @constructor
     * @param {hr.component.BindingCollection} bindings - The bindings to use to lookup elements
     * @param {hr.form.AjaxLifecycleSettings} [settings] - The settings for the form, optional
     */
    function FormLifecycle(bindings) {
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
        var formToggler = new toggles.Group(load, main, fail);

        var settingsModel = bindings.getModel('settings');

        this.populate = function () {
            formToggler.show(load);
            http.get(settingsModel.getSrc())
            .then(function (successData) {
                settingsModel.setData(successData);
                formToggler.show(main);
            })
            .catch(function (failData) {
                tryAgainFunc = self.populate;
                formToggler.show(fail);
            });
        }

        this.submit = function () {
            formToggler.show(load);
            var data = settingsModel.getData();
            http.post(settingsModel.getSrc(), data)
            .then(function (successData) {
                formToggler.show(main);
            })
            .catch(function (failData) {
                tryAgainFunc = self.submit;
                formToggler.show(fail);
            });
        }
    }
    module.exports = FormLifecycle;
});