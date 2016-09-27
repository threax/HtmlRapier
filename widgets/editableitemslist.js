﻿jsns.define("hr.widgets.editableitemslist", [
    "hr.controller",
],
function (exports, module, controller) {
    "use strict"

    function EditableItemsListController(bindings, context) {
        var listing = bindings.getModel('listing');

        function update() {
            context.getData()
            .then(function (data) {
                var creator = undefined;
                if (context.itemControllerConstructor !== undefined) {
                    creator = controller.createOnCallback(context.itemControllerConstructor, context.itemControllerContext);
                }

                listing.setData(data, creator);
            });
        }
        this.update = update;
        context.update = update;

        if (context.add !== undefined) {
            function add(evt) {
                evt.preventDefault();
                return context.add();
            }
            this.add = add;
        }
    };

    module.exports = EditableItemsListController;
});