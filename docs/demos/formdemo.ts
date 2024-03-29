/// This line gives our module a predictable name
///<amd-module name="form-demo"/>

"use strict";
import * as controller from './controller';
import { ValidationError, ErrorMap } from './error';

class FakeErrors implements ValidationError {
    public name;
    public message = "OMG Something is wrong!";
    public stack?;

    private errors = {
        first: "You call that a first name?",
        middle: "You call that a middle name?",
        address: "You call that an address?",
        enumTest: "Not a valid value.",
        multiChoice: "Not a valid multi choice.",
        "complexArray[0].First": "You must include a first name",
        "complexArray[1].Middle": "You must include a middle name"
    }

    /**
     * Get the validation error named name.
     */
    getValidationError(name: string): string | undefined{
        return this.errors[name];
    }

    /**
     * Check to see if a named validation error exists.
     */
    hasValidationError(name: string): boolean{
        //console.log("Checked for " + name); //Helps with debugging.
        return this.getValidationError(name) !== undefined;
    }

    /**
     * Determine if there are any validation errors.
     */
    hasValidationErrors() : boolean{
        return true;
    }

    addKey(baseName: string, key: string): string {
        if(baseName !== ""){
            //Make key 1st letter uppercase to match error from server
            return baseName + "." + key[0].toUpperCase() + key.substr(1);
        }
        return key;
    }

    addIndex(baseName: string, key: string, index: string | number): string {
        return baseName + key + '[' + index + ']';;
    }
}

class FormDemoController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    private form: controller.IForm<any>;

    public constructor(bindings: controller.BindingCollection) {
        this.form = bindings.getForm("form");
        this.form.setSchema(createTestSchema());
    }

    public submit(evt: Event): void{
        evt.preventDefault();
        var data = this.form.getData();
        console.log(JSON.stringify(data));
    }

    public setData1(evt: Event){
        evt.preventDefault();
        this.form.setData(this.createData());
    }
    
    public setData2(evt: Event){
        evt.preventDefault();
        var data = this.createData();
        data.stringArray = null
        this.form.setData(data);
    }

    public showErrors(evt: Event){
        evt.preventDefault();
        this.form.setError(new FakeErrors());
    }

    public clearErrors(evt: Event){
        evt.preventDefault();
        this.form.clearError();
    }

    public clear(evt: Event){
        evt.preventDefault();
        this.form.clear();
    }

    public setSchema1(evt: Event){
        evt.preventDefault();
        this.form.setSchema(createTestSchema());
    }

    public setSchema2(evt: Event){
        evt.preventDefault();
        var schema = createTestSchema();
        var props = schema.properties;
        delete props.middle;
        delete props.address;
        delete props.city;
        delete props.state;
        delete props.zipcode;
        this.form.setSchema(schema);
    }

    public setSchema3(evt: Event){
        evt.preventDefault();
        var schema = createTestSchema();
        var props = schema.properties;
        delete props.complexArray;
        delete props.stringArray;
        delete props.middle;
        delete props.address;
        delete props.city;
        delete props.state;
        delete props.zipcode;
        this.form.setSchema(schema);
    }

    private createData(){
        return {
            first: "Test First",
            middle: "Test Middle",
            last: "Test Last",
            comboTest: "two",
            multiChoice: [2],
            stringArray: ["first", "second", "thrid", "fourth"],
            complexArray: [{
                first: "first 1",
                middle: "middle 1",
                last: "last 1"
            },
            {
                first: "first 2",
                middle: "middle 2",
                last: "last 2"
            }]
        };
    }
}

var builder = new controller.InjectedControllerBuilder();
builder.Services.addTransient(FormDemoController, FormDemoController);
builder.create("formDemo", FormDemoController);

function createTestSchema(){
    return {
        "title": "Title of Input",
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "first": {
                "type": [
                    "null",
                    "string"
                ],
                "x-ui-order": 18
            },
            "middle": {
                "type": [
                    "null",
                    "string"
                ],
                "x-ui-order": 21
            },
            "last": {
                "type": [
                    "null",
                    "string"
                ],
                "x-ui-order": 24
            },
            "stringArray": {
                "type": [ "array", "null" ],
                "items": { "type": "string" },
                "x-ui-order": 1,
            },
            "complexArray": {
                "type": [ "array", "null" ],
                "items": { "type": "object",
                    "properties": {
                        "first": {
                            "type": [
                                "null",
                                "string"
                            ],
                            "x-ui-order": 18
                        },
                        "middle": {
                            "type": [
                                "null",
                                "string"
                            ],
                            "x-ui-order": 21
                        },
                        "last": {
                            "type": [
                                "null",
                                "string"
                            ],
                            "x-ui-order": 24
                        }
                    }
                },
                "x-ui-order": 2,
            },
            "multiChoice": {
                "title": "Multi Choice",
                "type": [
                    "array",
                    "null"
                ],
                "items": {
                    "type": "integer",
                    "format": "int32"
                },
                "x-ui-type": "select",
                "x-ui-order": 1,
                "x-values": [
                    {
                        "label": "Choice 1",
                        "value": 1
                    },
                    {
                        "label": "Choice 2",
                        "value": 2
                    }
                ]
            },
            "checktest": {
                "type": [
                    "boolean"
                ],
                "x-ui-order": 24
            },
            "comboTest": {
                "title": "Site",
                "type": "integer",
                "format": "int32",
                "x-ui-order": 27,
                "x-values": [
                    {
                        "label": "Choice 1",
                        "value": "one"
                    },
                    {
                        "label": "Choice 2",
                        "value": "two"
                    }
                ]
            },
            "enumTest": {
                "type": "string",
                "description": "",
                "x-enumNames": [
                    "Name 1",
                    "Name 2",
                    "Name 3"
                ],
                "enum": [
                    "Name1",
                    "Name2",
                    "Name3"
                ],
                "x-ui-order": 38
            },
            "dateTest": {
                "type": "date",
                "format": "date-time",
                "x-ui-order": 50
            },
            "address": {
                "type": [
                    "null",
                    "string"
                ],
                "x-ui-order": 53
            },
            "city": {
                "type": [
                    "null",
                    "string"
                ],
                "x-ui-order": 56
            },
            "state": {
                "type": [
                    "null",
                    "string"
                ],
                "x-ui-order": 59
            },
            "zipcode": {
                "type": [
                    "null",
                    "string"
                ],
                "x-ui-order": 62
            }
        },
        "x-is-array": false
    };
}