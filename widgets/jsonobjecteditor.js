jsns.define("hr.widgets.jsonobjecteditor", [
    "hr.toggles",
    "json-editor",
    "hr.promiseutils"
],
function (exports, module, toggles, jsonEditor, promiseUtils) {
    "use strict"
    /**
     * This is a generic object editor that uses json-editor to edit objects.
     * The ui is determined by the html. This supports a load, main, fail
     * lifecycle. It can also be put on a dialog named 'dialog', which it will
     * activate when required. It also consideres closing this dialog to be
     * a cancellation.
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
        var fail = bindings.getToggle('fail');
        var formToggles = new toggles.Group(load, main, fail);
        formToggles.activate(main);

        var currentPromise = null;

        function edit(data) {
            currentPromise = new promiseUtils.External();
            formToggles.activate(main);
            titleModel.setData(data);
            modeModel.setData("Edit");
            formModel.setData(data);
            dialog.on();
            return currentPromise.promise;
        }
        this.edit = edit;
        context.edit = edit;

        function submit(evt) {
            evt.preventDefault();
            if (currentPromise !== null) {
                formToggles.activate(load);
                var data = formModel.getData();
                var prom = currentPromise;
                currentPromise = null;
                prom.resolve(data);
                dialog.off();
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
    }

    module.exports = JsonObjectEditor;
});