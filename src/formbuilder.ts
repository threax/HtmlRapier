///<amd-module name="hr.formbuilder"/>

import * as component from 'hr.components';

interface JsonSchema {
    title?: string;
    type?: string;
    additionalProperties?: boolean;
    properties?: JsonPropertyMap;
}

interface JsonProperty {
    title?: string;
    type?: string | string[];
    format?: string;
    "x-ui-order"?: number;
    "x-values"?: JsonLabel[];
}

interface ProcessedJsonProperty extends JsonProperty {
    buildName: string;
}

type JsonPropertyMap = { [key: string]: JsonProperty };

interface JsonLabel {
    label: string;
    value: any;
}

export function buildForm(componentName: string, schema: JsonSchema, formElement: HTMLFormElement) {
    ////Clear existing elements
    //while (formElement.lastChild) {
    //    formElement.removeChild(formElement.lastChild);
    //}
    
    var propArray: ProcessedJsonProperty[] = [];
    var props = schema.properties;
    if (props) {
        for(var key in props){
            var processed = Object.create(props[key]);
            processed.buildName = key;
            propArray.push(processed);
        }

        propArray.sort((a, b) =>{
            return a["x-ui-order"] - b["x-ui-order"];
        });

        for(var i = 0; i < propArray.length; ++i){
            var variantFinder = (i) =>{
                return null;
            };
            component.one(componentName, propArray[i], formElement, undefined, undefined, undefined);
        }
    }
}