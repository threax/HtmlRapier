///<amd-module name="hr.schema"/>

export type JsonPropertyMap = { [key: string]: JsonProperty };

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
    items?: JsonSchema;
    "x-ui-order"?: number;
    "x-ui-type"?: string;
    "x-values"?: JsonLabel[]; //The source values if there are multiple
    enum?: string[];
    "x-enumNames"?: string[]; //The enum names, will be combined with enum to make values
    "x-value"?: JsonLabel[]; //If there is a single value for the field, use that, can override default values for things like checkboxes
}

export interface JsonLabel {
    label: string;
    value: any;
}