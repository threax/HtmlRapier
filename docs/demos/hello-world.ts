/// This line gives our module a predictable name
///<amd-module-off name="hello-world-demo"/>

"use strict";
import * as controller from "hr.controller";

//Define the contents of your views with interfaces, this documents what can be written to a view.
interface IHelloView {
    message: string;
}

//Define a class to hold our controller, no base class, these are pojos.
class HelloWorldController {
    //This is the arguments for the dependency injector, you return the constructor
    //functions for the types you want to inject into the constructor.
    //The return items here and the arguments to the constructor must match.
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    //Views are strongly typed to help ensure the right data gets into them.
    private view: controller.IView<IHelloView>;

    public constructor(bindings: controller.BindingCollection) {
        //Extract the view from the binding collection.
        this.view = bindings.getView<IHelloView>("hello");

        //Set the data on the view.
        this.view.setData({
            message: "World"
        });
    }
}

//Create a controller builder.
var builder = new controller.InjectedControllerBuilder();

//Add our new class to the dependency injector as a transient (create every time) instance.
builder.Services.addTransient(HelloWorldController, HelloWorldController);

//Finally create an instance of the controller for each apperance of a 
//data-hr-controller attribute on an element with the value "helloWorldDemo"
builder.create("helloWorldDemo", HelloWorldController);