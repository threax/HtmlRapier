"use strict";

(function (Sizzle) {
    //Form Functions
    htmlrest.form = htmlrest.form || {
        serialize: function (form) {
            //This is from https://code.google.com/archive/p/form-serialize/downloads
            //Modified to return an object instead of a query string
            form = htmlrest.component.getPlainElement(form);

            if (!form || form.nodeName !== "FORM") {
                return;
            }
            var i, j, q = {};
            for (i = form.elements.length - 1; i >= 0; i = i - 1) {
                if (form.elements[i].name === "") {
                    continue;
                }
                switch (form.elements[i].nodeName) {
                    case 'INPUT':
                        switch (form.elements[i].type) {
                            case 'text':
                            case 'hidden':
                            case 'password':
                            case 'button':
                            case 'reset':
                            case 'submit':
                                q[form.elements[i].name] = form.elements[i].value;
                                break;
                            case 'checkbox':
                            case 'radio':
                                if (form.elements[i].checked) {
                                    q[form.elements[i].name] = form.elements[i].value;
                                }
                                break;
                            case 'file':
                                break;
                        }
                        break;
                    case 'TEXTAREA':
                        q[form.elements[i].name] = form.elements[i].value;
                        break;
                    case 'SELECT':
                        switch (form.elements[i].type) {
                            case 'select-one':
                                q[form.elements[i].name] = form.elements[i].value;
                                break;
                            case 'select-multiple':
                                for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1) {
                                    if (form.elements[i].options[j].selected) {
                                        q[form.elements[i].name] = form.elements[i].options[j].value;
                                    }
                                }
                                break;
                        }
                        break;
                    case 'BUTTON':
                        switch (form.elements[i].type) {
                            case 'reset':
                            case 'submit':
                            case 'button':
                                q[form.elements[i].name] = form.elements[i].value;
                                break;
                        }
                        break;
                }
            }
            return q;
        },

        populate: function (form, data) {
            form = htmlrest.component.getPlainElement(form);
            var nameAttrs = Sizzle('[name]', form);
            for (var i = 0; i < nameAttrs.length; ++i) {
                var element = nameAttrs[i];
                element.value = data[element.getAttribute('name')];
            }
        },

        /**
         * Settings for the form ajax lifecycle.
         * @constructor
         */
        AjaxLifecycleSettings: function(){
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
                return new htmlrest.animate.NoAnimations();
            }

            this.getForm = function (bindings) {
                if (htmlrest.isString(self.form)) {
                    return bindings.first(self.form);
                }
                return self.form;
            }

            this.getMainDisplay = function (bindings) {
                if (htmlrest.isString(self.mainDisplay)) {
                    return bindings.first(self.mainDisplay);
                }
                return self.mainDisplay;
            }

            this.getLoadDisplay = function (bindings) {
                if (htmlrest.isString(self.loadDisplay)) {
                    return bindings.first(self.loadDisplay);
                }
                return self.loadDisplay;
            }

            this.getFailDisplay = function (bindings) {
                if (htmlrest.isString(self.failDisplay)) {
                    return bindings.first(self.failDisplay);
                }
                return self.failDisplay;
            }
        },
        
        /**
         * Create a simple ajax lifecyle for the form. This will show a loading screen
         * when fetching data and provides provisions to handle a data connection failure.
         * @constructor
         * @param {htmlrest.component.BindingCollection} bindings
         * @param {htmlrest.form.AjaxLifecycleSettings} [settings]
         */
        ajaxLifecycle: function (bindings, settings) {
            if (settings === undefined) {
                settings = new htmlrest.form.AjaxLifecycleSettings();
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
                htmlrest.rest.get(url, getSuccess, getFail);
            }

            function getSuccess(data) {
                hideAll();
                htmlrest.form.populate(form, data);
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
                var data = htmlrest.form.serialize(form);
                htmlrest.rest.post(url, data, postSuccess, postFail);
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
    }
})(Sizzle);