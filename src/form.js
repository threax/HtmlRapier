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
         * Create a simple ajax lifecyle for the form. This will show a loading screen
         * when fetching data and provides provisions to handle a data connection failure.
         * This will look for 4 bindings
         * form - the form to bind to.
         * main - the main display, can be different from the form itself, if this is not found the form will be used instead.
         * load - the element to display when loading
         * fail - The element to display if the form fails to load
         * @constructor
         */
        ajaxLifecycle: function (bindings, settings) {
            var form = null;
            if (!settings || settings.form === undefined) {
                form = bindings.first("form");
            }
            else if (htmlrest.isString(settings.form)) {
                form = bindings.first(settings.form);
            }
            else {
                form = settings.form;
            }

            var animations = undefined;
            if (settings && settings.animations) {
                animations = settings.animations;
            }
            else {
                animations = new htmlrest.animate.NoAnimations();
            }

            var mainDisplayQuery = "main";
            if (settings && settings.mainDisplayQuery) {
                mainDisplayQuery = settings.mainDisplayQuery;
            }
            var mainDisplay = bindings.first(mainDisplayQuery);

            //If no main dispaly is found use the form
            if (!mainDisplay) {
                mainDisplay = form;
            }

            var populateFailQuery = "fail";
            if (settings && settings.populateFailQuery) {
                populateFailQuery = settings.populateFailQuery;
            }
            var populateFailDisplay = bindings.first(populateFailQuery);

            var loadingDisplayQuery = "load";
            if (settings && settings.loadingDisplayQuery) {
                loadingDisplayQuery = settings.loadingDisplayQuery;
            }
            var loadingDisplay = bindings.first(loadingDisplayQuery);

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