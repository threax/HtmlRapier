///<amd-module name="hr.schema"/>

import * as expression from 'hr.expressiontree';

export type JsonPropertyMap = { [key: string]: JsonProperty };

export interface SearchInfo {
    provider: string;
    valueProperty: string;
}

export interface JsonSchema {
    title?: string;
    type?: string;
    additionalProperties?: boolean;
    properties?: JsonPropertyMap;
    definitions?: {};
}

export interface JsonProperty {
    title?: string;
    type?: string | string[];
    format?: string;
    items?: JsonSchema;
    "x-ui-order"?: number;
    "x-ui-disabled"?: boolean;
    readOnly?: boolean;
    "x-ui-type"?: string;
    "x-values"?: JsonLabel[]; //The source values if there are multiple
    enum?: string[];
    "x-enumNames"?: string[]; //The enum names, will be combined with enum to make values
    "x-value"?: string; //If there is a single value for the field, use that, can override default values for things like checkboxes
    "x-display-if"?: expression.ExpressionNode;
    "x-lazy-load-values"?: boolean; //This will be true if the property will lazy load its values later, if this is true the property will be treated like it has values set
    "x-search"?: SearchInfo;
}

export interface JsonLabel {
    label: string;
    value: any;
}

export interface RefNode{
    $ref?: string;
}

export function isRefNode(test: any): test is RefNode {
    return test.$ref !== undefined;
}

/**
 * Find the ref and return it for node if it exists.
 * @param node The node to expand
 */
export function resolveRef(node: RefNode, schema: JsonSchema): any{
    if(node.$ref !== undefined){
        var walker = schema;
        var refs = node.$ref.split('/');
        for(var i = 1; i < refs.length; ++i){
            walker = walker[refs[i]];
            if(walker === undefined){
                throw new Error("Cannot find ref '" + node.$ref + "' in schema.")
            }
        }

        return walker;
    }
    return node;
}

export function mergeDefinitions(source: JsonSchema, dest: JsonSchema, overwrite: boolean): void {
    if (dest.definitions) {
        //Merge definitions
        for (var key in source) {
            if (overwrite || dest.definitions[key] === undefined) {
                dest.definitions[key] = source;
            }
        }
    }
    else {
        dest.definitions = Object.create(source.definitions);
    }
}