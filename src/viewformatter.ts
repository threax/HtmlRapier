import * as schema from 'hr.schema';
import * as typeId from 'hr.typeidentifiers';

export interface IViewDataFormatter<T> {
    convert(data: T): Extractor<T>;
}

export interface Extractor<T> {
    (name: string): any;
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

    public convert(data:T): Extractor<T> {
        var extractor: any = (name: string) => {
            return this.extract(name, data);
        };

        extractor.original = data;

        return extractor;
    }

    private extract(name: string, data: any) {
        var prop = this.schema.properties[name];
        var rawData;
        if (typeId.isFunction(data)) {
            rawData = data[name];
        }
        else {
            rawData = data[name];
        }
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
                    enumNames.length === enumValues.length)
                {
                    for (var i = 0; i < enumValues.length; ++i) {
                        if (enumValues[i] == rawData) {
                            return enumNames[i];
                        }
                    }
                }
            }

            var format = prop['x-ui-type'];
            if (format === undefined) { //If no x-ui-type also consider the format the json schema gives us
                format = prop.format;
            }

            //Check for dates, come in a couple ways
            if(rawData !== null) {
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
}