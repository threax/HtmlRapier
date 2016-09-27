jsns.define("hr.widgets.editdeleteitem", [
    "hr.controller",
    "hr.typeidentifiers",
],
function (exports, module, controller, typeId) {
    "use strict"

    function EditDeleteItemController(bindings, context, data) {

        if (typeId.isFunction(context.edit)) {
            function edit(evt) {
                evt.preventDefault();
                context.edit(data);
            }
            this.edit = edit;
        }

        if (typeId.isFunction(context.delete)) {
            function deleteMe(evt) {
                evt.preventDefault();
                context.delete(data);
            }
            this.delete = deleteMe;
        }
    }

    module.exports = EditDeleteItemController;
});