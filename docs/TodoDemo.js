"use strict";

jsns.run([
    "hr.controller",
    "hr.iterable"
], function (exports, module, controller, Itearable) {
    function TodoDemoController(bindings) {
        var addModel = bindings.getModel('add');
        var itemsModel = bindings.getModel('items');
        itemsModel.clear();
        var todoItems = [];

        function findItemVariant(item){
            if (item.important === "on") {
                return "important";
            }
        }

        function addItem(evt) {
            evt.preventDefault();
            var item = addModel.getData();
            itemsModel.appendData(item, null, findItemVariant);
            todoItems.push(item);
        }
        this.addItem = addItem;

        function removeItem(item) {
            var index = todoItems.indexOf(item);
            if (index != -1) {
                todoItems.splice(index, 1);
                rebuildList();
            }
        }
        this.removeItem = removeItem;

        function rebuildList() {
            todoItems.setData(todoItems, null, findItemVariant);
        }
    }

    controller.create("todo", TodoDemoController);
});