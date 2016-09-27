jsns.define("json-editor", [
    
],
function (exports, module) {
    "use strict";
    if (window.JSONEditor !== undefined) {
        JSONEditor.defaults.theme = 'bootstrap3';
        JSONEditor.defaults.disable_collapse = true;
        JSONEditor.defaults.disable_edit_json = true;
        JSONEditor.defaults.disable_properties = true;
        exports.JSONEditor = window.JSONEditor;

        /**
         * A model interface for the json editor.
         * @param {JSONEditor} editor - The editor to wrap.
         */
        function Model(editor){
            this.setData = function (data) {
                editor.root.setValue(data, true);
            }

            this.appendData = this.setData;

            function clear() {
                editor.root.setValue(null, true);
            }
            this.clear = clear;

            this.getData = function () {
                return editor.getValue();
            }

            this.getSrc = function () {
                return null;
            }

            this.getEditor = function () {
                return editor;
            }
        }
        exports.Model = Model;

        function create(element, options) {
            return new Model(new exports.JSONEditor(element, options));
        }
        exports.create = create;
    }
});