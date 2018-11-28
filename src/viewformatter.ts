import * as schema from 'hr.schema';
import * as typeId from 'hr.typeidentifiers';
import * as exprTree from 'hr.expressiontree';
import { JsonSchema, JsonProperty } from 'hr.schema';
import { ITextStreamData } from 'hr.textstream';

export interface IViewDataFormatter<T> {
    convert(data: T): Extractor<T>;
}

export interface Extractor<T> extends ITextStreamData {
    original: T;
};

export interface ISchemaViewFormatterArgs {
    prop: schema.JsonProperty;
    schema: schema.JsonSchema;
    propData: any;
    data: any;
    name: string;
}

export interface ISchemaViewFormatterExtension {
    /**
     * Get the data specified by args. Return undefined if the data is not handled.
     * @param args
     */
    extract(args: ISchemaViewFormatterArgs): any | undefined;
}

var schemaFormatterExtensions: ISchemaViewFormatterExtension[] = [];

export function registerSchemaViewFormatterExtension(builder: ISchemaViewFormatterExtension) {
    schemaFormatterExtensions.push(builder);
}

export class SchemaViewFormatter<T> implements IViewDataFormatter<T> {
     constructor(private schema: schema.JsonSchema) {

    }

    public convert(data: T): Extractor<T> {
        return new SchemaViewExtractor(this, data, this.schema);
    }
}

class SchemaViewExtractor<T> implements Extractor<T> {
    constructor(private dataFormatter: IViewDataFormatter<T>, public original: T, private schema: schema.JsonSchema) { }

    getRawData(address: exprTree.IDataAddress) {
        return address.read(this.original);
    }

    getFormatted(data: any, address: exprTree.IDataAddress) {
        return this.extract(data, address.address);
    }

    private extract(data: any, address: exprTree.AddressNode[]) {
        //Need to lookup info better than this
        var name = <string>address[address.length - 1].key; //Assume string for now
        var prop = this.getPropertyForAddress(this.schema, address);
        var rawData = data;
        if (rawData === undefined) {
            rawData = null; //Normalize to null
        }

        if (prop) {
            var args: ISchemaViewFormatterArgs = {
                data: data,
                name: name,
                prop: prop,
                propData: rawData,
                schema: this.schema,
            }
            for (var i = 0; i < schemaFormatterExtensions.length; ++i) {
                var extracted = schemaFormatterExtensions[i].extract(args);
                if (extracted !== undefined) {
                    return extracted;
                }
            }

            var values = prop['x-values'];
            if (values !== undefined && Array.isArray(values)) {
                for (var i = 0; i < values.length; ++i) {
                    if (values[i].value == rawData) {
                        return values[i].label;
                    }
                }
            }
            else {
                //Enums are separate arrays
                var enumNames = prop['x-enumNames'];
                var enumValues = prop['enum'];
                if (enumNames !== undefined && Array.isArray(enumNames) &&
                    enumValues !== undefined && Array.isArray(enumValues) &&
                    enumNames.length === enumValues.length) {
                    for (var i = 0; i < enumValues.length; ++i) {
                        if (enumValues[i] == rawData) {
                            return enumNames[i];
                        }
                    }
                }
            }

            var format = prop['x-ui-type'];
            if(format === undefined && prop.xUi){
                format = prop.xUi.type
            }
            if (format === undefined) { //If no x-ui-type also consider the format the json schema gives us
                format = prop.format;
            }

            //Check for dates, come in a couple ways
            if (rawData !== null) {
                switch (format) {
                    case 'date':
                        var date = new Date(rawData);
                        return date.toLocaleDateString();
                    case 'date-time':
                        var date = new Date(rawData);
                        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                }
            }
        }

        //Handle undefined and null the same way
        if (rawData === null) {
            return (prop !== undefined && prop['x-null-value']) || "";
        }

        //Handle true values
        if (rawData === true) {
            return (prop !== undefined && prop['x-value']) || "Yes";
        }

        //Handle false values
        if (rawData === false) {
            return (prop !== undefined && prop['x-false-value']) || "No";
        }

        return rawData;
    }

    private findSchemaProperty(rootSchema: schema.JsonSchema, prop: schema.JsonProperty, name: string | number): JsonProperty {
        //Find ref node
        var ref;
        if (prop.oneOf) {
            for (var i = 0; i < prop.oneOf.length; ++i) {
                var type = prop.oneOf[i];
                if (schema.isRefNode(type)) {
                    ref = type;
                    break;
                }
            }
        }
        else if (prop.items) {
            if (schema.isRefNode(prop.items)) {
                ref = prop.items;
            }
        }

        if (!ref) {
            throw new Error("Cannot find ref in schema properties.");
        }

        var ref = schema.resolveRef(ref, rootSchema);
        return ref.properties[name];
    }

    private getPropertyForAddress(rootSchema: JsonSchema, address: exprTree.AddressNode[]): JsonProperty {
        var prop = rootSchema.properties[address[0].key];
        if (prop === undefined) {
            return undefined;
        }
        for (var i = 1; i < address.length; ++i) {
            var item = address[i];
            prop = this.findSchemaProperty(rootSchema, prop, item.key); //Assuming strings for now
            if (prop === undefined) {
                return undefined;
            }
        }
        return prop;
    }
}