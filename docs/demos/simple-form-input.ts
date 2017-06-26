///<amd-module name="simple-form-input-demo"/>

"use strict";
import * as controller from "hr.controller";

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
        this.input = bindings.getForm<PersonInfo>("input");
        this.output = bindings.getView<PersonInfo>("output");
    }

    public outputInfo(evt: Event): void {
        evt.preventDefault();
        var data = this.input.getData();
        this.output.setData(data);
    }
}

var builder = new controller.InjectedControllerBuilder();
builder.Services.addTransient(FormDemoController, FormDemoController);
builder.create("inputDemo", FormDemoController);