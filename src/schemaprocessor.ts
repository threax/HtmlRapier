import { JsonProperty, JsonLabel, JsonSchema, resolveRef, RefNode, isRefNode } from './schema';
import * as expression from './expressiontree';

export interface ProcessedJsonProperty extends JsonProperty {
    name: string;
    buildName: string;
    buildType: string;
    buildOrder: number;
    buildValues?: JsonLabel[]; //The values if there are multiple value choices, e.g. combo boxes
    size?: number;
    buildValue?: string; //The value if there is a single value for this item, e.g. checkboxes
    displayExpression?: expression.ExpressionTree;
    uniqueId: string;
}

export function processProperty(prop: JsonProperty, schema: JsonSchema, uniqueId: string, name: string, buildName: string): ProcessedJsonProperty {
    //Assign the xUi type to the x-ui-type for the prop, since that is what we expect to process.
    if(prop.xUi && prop.xUi.type){
        prop["x-ui-type"] = prop.xUi.type;
    }
    var processed: ProcessedJsonProperty = Object.create(prop);
    processed.uniqueId = uniqueId;
    processed.buildName = buildName;
    processed.name = name;
    if (processed.title === undefined) { //Set title if it is not set
        processed.title = name;
    }

    if (prop["x-ui-order"] !== undefined) {
        processed.buildOrder = prop["x-ui-order"];
    }
    else {
        processed.buildOrder = Number.MAX_VALUE;
    }

    if (prop["x-display-if"] !== undefined) {
        processed.displayExpression = new expression.ExpressionTree(prop["x-display-if"]);
    }

    //Set this build type to what has been passed in, this will be processed further below
    processed.buildType = getBuildType(prop).toLowerCase();

    //Look for collections, anything defined as an array or that has x-values defined
    if (processed.buildType === 'array') {
        //In an array we might have items with values defined, so look for that
        var valuesProp = prop;
        if (valuesProp.items && (<any>valuesProp.items).$ref) {
            valuesProp = valuesProp.items;
        }
        extractPropValues(valuesProp, processed, schema, prop);

        if (processed.buildValues !== undefined || processed["x-lazy-load-values"] === true) {
            //Only supports checkbox and multiselect ui types. Checkboxes have to be requested.
            if (prop["x-ui-type"] === "checkbox") {
                processed.buildType = "multicheckbox";
            }
            else {
                processed.buildType = "multiselect";
                if (processed.buildValues !== undefined) {
                    processed.size = processed.buildValues.length;
                    if (processed.size > 15) {
                        processed.size = 15;
                    }
                }
            }
        }
        else {
            //Array of complex objects, since values are not provided
            processed.buildType = "arrayEditor";
        }
    }
    else {
        extractPropValues(prop, processed, schema, prop);

        if (prop["x-ui-type"] !== undefined) {
            processed.buildType = prop["x-ui-type"];
        }
        else if(prop["x-search"] !== undefined){
            processed.buildType = "search";
        }
        else {
            if (processed.buildValues !== undefined || processed["x-lazy-load-values"] === true) {
                //Has build options, force to select unless the user chose something else.
                processed.buildType = "select";
            }
            else {
                //Regular type, no options, derive html type
                switch (processed.buildType) {
                    case 'integer':
                        processed.buildType = 'number';
                        break;
                    case 'boolean':
                        processed.buildType = 'checkbox';
                        break;
                    case 'string':
                        switch (processed.format) {
                            case 'date-time':
                                processed.buildType = 'date-time';
                                break;
                            default:
                                processed.buildType = 'text';
                                break;
                        }
                        break;
                    case 'object':
                        processed.buildType = "objectEditor";
                        break;
                }
            }
        }

        //Post process elements that might have more special properties
        //Do this here, since we don't really know how we got to this build type
        switch (processed.buildType) {
            case 'checkbox':
                processed.buildValue = "true";
                if (prop["x-value"] !== undefined) {
                    processed.buildValue = prop["x-value"];
                }
                break;
            case 'textarea':
                if (processed.size === undefined) {
                    processed.size = 5;
                }
                break;
        }
    }

    return processed;
}

function extractLabels(valuesProp: JsonProperty, originalProp: JsonProperty): JsonLabel[] {
    var values: JsonLabel[] = [];
    var foundNull = false;

    var theEnum = valuesProp.enum;
    var enumNames = theEnum;
    if (valuesProp["x-enumNames"] !== undefined) {
        enumNames = valuesProp["x-enumNames"];
    }
    for (var i = 0; i < theEnum.length; ++i) {
        var value = theEnum[i];
        foundNull = foundNull || value === null;
        values.push({
            label: enumNames[i],
            value: value
        });
    }

    if (!foundNull && propertyCanBeNull(originalProp)) {
        var nullLabel = originalProp['x-null-value-label'] || "None";
        values.splice(0, 0, {
            label: nullLabel,
            value: null
        });
    }

    return values;
}

function extractPropValues(prop: JsonProperty, processed: ProcessedJsonProperty, schema: JsonSchema, originalProp: JsonProperty) {
    if (prop["x-values"] !== undefined) {
        processed.buildValues = prop["x-values"];
    }
    else if (prop.enum !== undefined) {
        processed.buildValues = extractLabels(prop, originalProp);
    }
    else {
        var refType = null;
        if (isRefNode(prop)) {
            refType = resolveRef(prop, schema);
            if (refType && refType.enum !== undefined) {
                processed.buildValues = extractLabels(refType, originalProp);
            }
        }
    }
}

function getBuildType(prop: JsonProperty): string {
    if (Array.isArray(prop.type)) {
        for (let j = 0; j < prop.type.length; ++j) {
            if (prop.type[j] !== "null") {
                return prop.type[j];
            }
        }
    }
    else if (prop.type) { //If the property type is set, return it
        return prop.type;
    }
    else if (Array.isArray(prop.oneOf)) { //Check to see if we have any ref oneOf properties, if so consider this an object
        for (let j = 0; j < prop.oneOf.length; ++j) {
            if (isRefNode(prop.oneOf[j])) {
                return "object";
            }
        }
    }
    return "string"; //Otherwise fallback to string
}

function propertyCanBeNull(prop: JsonProperty): boolean {
    if (Array.isArray(prop.type)) {
        for (var j = 0; j < prop.type.length; ++j) {
            if (prop.type[j] === "null") {
                return true;
            }
        }
    }
    else if (prop.type === "null") {
        return true;
    }
    return false;
}