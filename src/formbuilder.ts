///<amd-module name="hr.formbuilder"/>

import * as component from 'hr.components';
import * as domquery from 'hr.domquery';

export interface JsonSchema {
    title?: string;
    type?: string;
    additionalProperties?: boolean;
    properties?: JsonPropertyMap;
}

export interface JsonProperty {
    title?: string;
    type?: string | string[];
    format?: string;
    "x-ui-order"?: number;
    "x-ui-type"?: string;
    "x-values"?: JsonLabel[];
}

export interface ProcessedJsonProperty extends JsonProperty {
    buildName: string;
    buildType: string;
    buildOrder: number;
}

export type JsonPropertyMap = { [key: string]: JsonProperty };

export interface JsonLabel {
    label: string;
    value: any;
}

export function buildForm(componentName: string, schema: JsonSchema, formElement: HTMLFormElement) {
    ////Clear existing elements
    //while (formElement.lastChild) {
    //    formElement.removeChild(formElement.lastChild);
    //}

    console.log("still updating");
    
    var propArray: ProcessedJsonProperty[] = [];
    var props = schema.properties;
    if (props) {
        for(var key in props){
            propArray.push(processProperty(props[key], key));
        }

        propArray.sort((a, b) =>{
            return a.buildOrder - b.buildOrder;
        });

        for(var i = 0; i < propArray.length; ++i){
            var item = propArray[i];
            var existing = domquery.first('[name=' + item.buildName + ']', formElement);
            if(existing === null){
                component.one(componentName, item, formElement, undefined, undefined, (i) => {
                    return i.buildType;
                });
            }
        }
    }
}

function processProperty(prop: JsonProperty, key: string): ProcessedJsonProperty{
    var processed = Object.create(prop);
    processed.buildName = key;
    if(processed.title === undefined){ //Set title if it is not set
        processed.title = processed.buildName;
    }

    if(prop["x-ui-order"] !== undefined){
        processed.buildOrder = prop["x-ui-order"];
    }
    else{
        processed.buildOrder = Number.MAX_VALUE;
    }

    if(prop["x-ui-type"]){
        processed.buildType = prop["x-ui-type"];
    }
    else{
        processed.buildType = getPropertyType(prop).toLowerCase();
        switch(processed.buildType){
            case 'integer':
                processed.buildType = 'number';
                break;
            case 'boolean':
                processed.buildType = 'checkbox';
                break;
        }
    }

    return processed;
}

function getPropertyType(prop: JsonProperty) {
    if (Array.isArray(prop.type)) {
        for (var j = 0; j < prop.type.length; ++j) {
            if (prop.type[j] !== "null") {
                return prop.type[j];
            }
        }
    }
    else {
        return prop.type;
    }
    return "null";
}