///<amd-module name="toggle-demo"/>

"use strict";
import * as controller from "hr.controller";

class ToggleDemoController{
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    private toggle: controller.OnOffToggle;
    private on: boolean = false;

    public constructor(bindings: controller.BindingCollection){
        this.toggle = bindings.getToggle('color');
    }

    public toggleColors(evt: Event): void {
        this.on = !this.on;
        if (this.on) {
            this.toggle.on();
        }
        else {
            this.toggle.off();                
        }
    }
}

var builder = new controller.InjectedControllerBuilder();
builder.Services.addTransient(ToggleDemoController, ToggleDemoController);
builder.create("toggleDemo", ToggleDemoController);