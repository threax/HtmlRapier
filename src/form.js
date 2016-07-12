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

        ajaxLifecycle: function (settings) {
            var form = $(settings.formQuery); //form is required

            var mainDisplay = undefined;
            if (settings.mainDisplayQuery) {
                mainDisplay = $(settings.mainDisplayQuery);
            }

            var populateFailDisplay = undefined;
            if (settings.populateFailDisplayQuery) {
                populateFailDisplay = $(settings.populateFailDisplayQuery);
            }

            var loadingDisplay = undefined;
            if (settings.loadingDisplayQuery) {
                loadingDisplay = $(settings.loadingDisplayQuery);
            }

            //Populate
            this.populateData = function () {
                loading();
                var url = form.attr('action');
                htmlrest.rest.get(url, getSuccess, getFail);
            }

            function getSuccess(data) {
                hideAll();
                htmlrest.form.populate(form, data);
                if (mainDisplay) {
                    mainDisplay.show();
                }
            }

            function getFail(data) {
                hideAll();
                if (populateFailDisplay) {
                    populateFailDisplay.show();
                }
            }

            //Submit
            form.submit(function () {
                loading();
                var url = form.attr('action');
                var data = htmlrest.form.serialize(form);
                htmlrest.rest.post(url, data, postSuccess, postFail);
                return false;
            });

            function postSuccess(data) {
                hideAll();
                if (mainDisplay) {
                    mainDisplay.show();
                }
            }

            function postFail(data) {
                hideAll();
                if (mainDisplay) {
                    mainDisplay.show();
                }
                alert(data.message); //temp
            }

            //Display Functions
            function loading() {
                hideAll();
                if (loadingDisplay) {
                    loadingDisplay.show();
                }
            }

            function hideAll() {
                if (mainDisplay) {
                    mainDisplay.hide();
                }
                if (populateFailDisplay) {
                    populateFailDisplay.hide();
                }
                if (loadingDisplay) {
                    loadingDisplay.hide();
                }
            }
        }
    }
})(Sizzle);