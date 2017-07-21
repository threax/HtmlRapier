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
    buildValues?: JsonLabel[];
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
    
    var dynamicInsertElement = domquery.first("[data-hr-form-end]");
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
                //Create component if it is null
                component.one(componentName, item, formElement, dynamicInsertElement, undefined, (i) => {
                    return i.buildType;
                });
                
                //Refresh existing, should be found now.
                existing = domquery.first('[name=' + item.buildName + ']', formElement);
                if(existing === null){
                    throw new Error("Problem creating form element '" + item.buildName + "' could not get created element");
                }
            }
            //If there are values defined for the element, put them on the page, this works for both
            //predefined and generated elements, which allows you to have predefined selects that can have dynamic values
            if(item.buildValues !== undefined){
                if(IsSelectElement(existing)){
                    for(var q = 0; q < item.buildValues.length; ++q){
                        var current = item.buildValues[q];
                        var option = document.createElement("option");
                        option.text = current.label;
                        option.value = current.value;
                        existing.options.add(option);
                    }
                }
            }
        }
    }
}

function IsSelectElement(element: Node): element is HTMLSelectElement{
    return element && (element.nodeName === 'SELECT');
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

    //Set this build type to what has been passed in, this will be processed further below
    processed.buildType = getPropertyType(prop).toLowerCase();

    //Look for collections, anything defined as an array or that has x-values defined
    if(processed.buildType === 'array'){

    }
    else{
        //Not an array type, handle as single value
        if(prop["x-values"] !== undefined){
            //Type with values, make a combo box or checkboxes depending on what the user asked for
            var xValues = prop["x-values"];
            processed.buildValues = xValues;
            if(prop["x-ui-type"] !== undefined){
                processed.buildType = prop["x-ui-type"];
            }
            else{
                processed.buildType = "select";
            }
        }
        else
        {
            //Regular type, no options, derive html type
            if(prop["x-ui-type"] !== undefined){
                processed.buildType = prop["x-ui-type"];
            }
            else{
                switch(processed.buildType){
                    case 'integer':
                        processed.buildType = 'number';
                        break;
                    case 'boolean':
                        processed.buildType = 'checkbox';
                        break;
                }
            }
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