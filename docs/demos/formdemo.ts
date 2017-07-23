/// This line gives our module a predictable name
///<amd-module name="form-demo"/>

"use strict";
import * as controller from 'hr.controller';

class FormDemoController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    private form: controller.IForm<any>;

    public constructor(bindings: controller.BindingCollection) {
        this.form = bindings.getForm("form");
        this.form.setSchema(createTestSchema());
        this.form.setData({
            first: "Test First",
            middle: "Test Middle",
            last: "Test Last",
            comboTest: "two",
            multiChoice: [1,2]
        });
    }

    public submit(evt: Event): void{
        evt.preventDefault();
        var data = this.form.getData();
        console.log(JSON.stringify(data));
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