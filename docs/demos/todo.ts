///<amd-module-off name="todo-demo"/>

"use strict";
import * as controller from "hr.controller";

interface AddItemModel{
    text: string,
    important: string
}

class TodoDemoController{
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, controller.InjectedControllerBuilder];
    }

    private todoItems: AddItemModel[] = [];
    private addModel: controller.IForm<AddItemModel>;
    private itemsModel: controller.IView<AddItemModel>;

    public constructor(bindings: controller.BindingCollection, private builder: controller.InjectedControllerBuilder){
        this.addModel = bindings.getForm<AddItemModel>('add');
        this.itemsModel = bindings.getView<AddItemModel>('items');
        this.itemsModel.clear();
    }

    public findItemVariant(item: AddItemModel){
        if (item.important === "on") {
            return "important";
        }
    }

    public addItem(evt: Event): void {
        evt.preventDefault();
        var item = this.addModel.getData();
        this.itemsModel.appendData(item, this.builder.createOnCallback(TodoItemController), (item) => this.findItemVariant(item));
        this.todoItems.push(item);
        this.addModel.clear();
    }

    public removeItem(item: AddItemModel): void {
        var index = this.todoItems.indexOf(item);
        if (index != -1) {
            this.todoItems.splice(index, 1);
            this.rebuildList();
        }
    }

    public rebuildList() {
        this.itemsModel.setData(this.todoItems, this.builder.createOnCallback(TodoItemController), (item) => this.findItemVariant(item));
    }
}

class TodoItemController{
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, 
                TodoDemoController, 
                //This last line is a special placeholder injector that injects whatever the controller has bound as its "data" this can vary from the type used in the constructor itself
                controller.InjectControllerData];
    }

    public constructor(bindings: controller.BindingCollection, 
               private todoDemoController: TodoDemoController, 
               private itemData: AddItemModel){ //Here the type does not match the injector args, but we are injecting the special controller.InjectControllerData service here.
        
    }

    public edit(evt: Event): void {
        evt.preventDefault();
        //This is a silly way to edit, but trying to keep it short.
        this.itemData.text = window.prompt("Edit Todo Item", this.itemData.text);
        this.todoDemoController.rebuildList();
    }

    public deleteItem(evt: Event): void {
        evt.preventDefault();
        //Silly to use confirm, but done for size
        if (window.confirm("Do you want to delete " + this.itemData.text + "?")) {
            this.todoDemoController.removeItem(this.itemData);
        }
    }
}

var builder = new controller.InjectedControllerBuilder();
//Inject the TodoDemoController as a shared instance so all the TodoItemController instances can see the same one.
builder.Services.addShared(TodoDemoController, TodoDemoController);
//Inject the TodoItemController as a transient instance since we want a new one for each row.
builder.Services.addTransient(TodoItemController, TodoItemController);

builder.create("todo", TodoDemoController);