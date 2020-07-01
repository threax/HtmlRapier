///<amd-module-off name="simple-form-input-demo"/>

"use strict";
import * as controller from "hr.controller";

//Create an interface for the data we are handling, so we know what we can put on the form and in the view.
interface PersonInfo{
    userName: string;
}

class FormDemoController{
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    private input: controller.IForm<PersonInfo>;
    private output: controller.IView<PersonInfo>;

    public constructor(bindings: controller.BindingCollection){
        //Get the form for the input
        this.input = bindings.getForm<PersonInfo>("input");

        //Get the view
        this.output = bindings.getView<PersonInfo>("output");
    }

    //This function will be bound to the event labeled data-hr-event-submit="outputInfo"
    //It should be written as if you were adding it to addEventListener.
    public outputInfo(evt: Event): void {
        evt.preventDefault();
        var data = this.input.getData();
        this.output.setData(data);
    }
}

var builder = new controller.InjectedControllerBuilder();
builder.Services.addTransient(FormDemoController, FormDemoController);
builder.create("inputDemo", FormDemoController);