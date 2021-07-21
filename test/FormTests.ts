import * as exprTree from 'src/expressionTree';
import * as textstream from 'src/textstream';
import { TestContext, setupTests } from './UnitTests';
import { IForm, DiFunction, BindingCollection, InjectedControllerBuilder } from 'src/controller';
import { IViewDataFormatter, Extractor } from 'src/view';
import { JsonSchema } from 'src/schema';

var runner = setupTests();
runner.beginTestSection("Form");

//This test won't work until a form builder is loaded. It was relying on runners.
runner.runTest("Simple Form", c => {
    class TestController {
        private form: IForm<any>;

        public static get InjectorArgs(): DiFunction<any>[] {
            return [BindingCollection, TestContext];
        }

        constructor(bindings: BindingCollection, testContext: TestContext) {
            this.form = bindings.getForm("form");
            var schema: JsonSchema = createInputSchema();
            this.form.setSchema(schema);
        }

        public submit(evt: Event): void {
            evt.preventDefault();
            alert(JSON.stringify(this.form.getData()));
        }
    }

    var builder = new InjectedControllerBuilder();
    builder.Services.addShared(TestContext, s => c);
    builder.Services.addShared(TestController, TestController);
    var result = builder.create("simpleForm", TestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.endTestSection();

function createInputSchema(): any {
    return {
        "title": "Input",
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "field": {
                "type": [
                    "null",
                    "string"
                ]
            }
        }
    }
}

function createComplexSchema(): any {
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
                "type": ["array", "null"],
                    "items": { "type": "string" },
                "x-ui-order": 1,
                    },
            "complexArray": {
                "type": ["array", "null"],
                    "items": {
                    "type": "object",
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
        }
    }
}