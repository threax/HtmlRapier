jsns.define("hr.widgets.crudpage", [
    "hr.controller",
    "hr.widgets.jsonobjecteditor",
    "hr.widgets.editableitemslist",
    "hr.widgets.editdeleteitem"
],
function (exports, module, controller, JsonObjectEditor, EditableItemsList, EditDeleteItem) {
    "use strict"

    /**
     * This is a shortcut to create a page to create, read, update and delete a type of
     * data provided by a service. A model of the data is used to construct an editor
     * automatically from elements on the page.
     * @param {type} settings
     */
    function CrudPage(settings) {
        var listingContext = {
            itemControllerConstructor: EditDeleteItem,
            itemControllerContext: {
                edit: settings.update,
                del: settings.del
            },
            getData: settings.read,
            add: settings.create
        };
        controller.create(settings.listController, EditableItemsList, listingContext);

        var editorContext = {
            schema: settings.schema,
        };
        controller.create(settings.itemEditorController, JsonObjectEditor, editorContext);

        function refreshData() {
            return listingContext.update();
        }
        this.refreshData = refreshData;

        function edit(data) {
            return editorContext.edit(data);
        }
        this.edit = edit;

        refreshData();
    };

    module.exports = CrudPage;
});