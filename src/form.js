"use strict";

jsns.define("htmlrest.form", function (using) {
    var domQuery = using("htmlrest.domquery");

    //Form Functions
    var exports = {
        /**
         * Serialze a form to a javascript object
         * @param {HTMLElement|string} form - A selector or form element for the form to serialize.
         * @returns {object} - The object that represents the form contents as an object.
         */
        serialize: function (form) {
            //This is from https://code.google.com/archive/p/form-serialize/downloads
            //Modified to return an object instead of a query string
            form = domQuery.first(form);

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
                            case 'file':
                                q[form.elements[i].name] = form.elements[i].value;
                                break;
                            case 'checkbox':
                            case 'radio':
                                if (form.elements[i].checked) {
                                    q[form.elements[i].name] = form.elements[i].value;
                                }
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

        /**
         * Populate a form with data.
         * @param {HTMLElement|string} form - The form to populate or a query string for the form.
         * @param {object} data - The data to bind to the form, form name attributes will be mapped to the keys in the object.
         */
        populate: function (form, data) {
            form = domQuery.first(form);
            var nameAttrs = domQuery.all('[name]', form);
            for (var i = 0; i < nameAttrs.length; ++i) {
                var element = nameAttrs[i];
                element.value = data[element.getAttribute('name')];
            }
        }
    }

    return exports;
});