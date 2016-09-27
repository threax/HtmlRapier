jsns.define("hr.widgets.jsonobjecteditor", [
    "hr.toggles",
    "json-editor",
    "hr.promiseutils"
],
function (exports, module, toggles, jsonEditor, promiseUtils) {
    "use strict"
    /**
     * This is a generic object editor that uses json-editor to edit objects.
     * The ui is determined by the html. This supports a load, main, error
     * lifecycle, but it is controlled externally. It can also be put on a 
     * dialog named 'dialog', which it will activate when required. It also 
     * consideres closing this dialog to be a cancellation and will reject
     * its promise at that point.
     */
    function JsonObjectEditor(bindings, context) {
        var modeModel = bindings.getModel('mode');
        var titleModel = bindings.getModel('title');
        var formModel = new jsonEditor.create(bindings.getHandle("editorHolder"), {
            schema: context.schema
        });

        var dialog = bindings.getToggle('dialog');
        dialog.offEvent.add(this, closed);

        var load = bindings.getToggle('load');
        var main = bindings.getToggle('main');
        var error = bindings.getToggle('error');
        var formToggles = new toggles.Group(load, main, error);
        formToggles.activate(main);

        var currentPromise = null;

        function edit(data) {
            currentPromise = new promiseUtils.External();
            titleModel.setData(data);
            modeModel.setData("Edit");
            formModel.setData(data);
            return currentPromise.promise;
        }
        this.edit = edit;
        context.edit = edit;

        function submit(evt) {
            evt.preventDefault();
            if (currentPromise !== null) {
                var data = formModel.getData();
                var prom = currentPromise;
                currentPromise = null;
                prom.resolve(data);
            }
        }
        this.submit = submit;

        function closed() {
            if (currentPromise !== null) {
                var prom = currentPromise;
                currentPromise = null;
                prom.reject();
            }
        }

        context.showMain = function () {
            formToggles.activate(main);
        }

        context.showLoad = function () {
            formToggles.activate(load);
        }

        context.showError = function () {
            formToggles.activate(error);
            main.on();
        }

        context.show = function () {
            dialog.on();
        }

        context.close = function () {
            dialog.off();
        }
    }

    module.exports = JsonObjectEditor;
});