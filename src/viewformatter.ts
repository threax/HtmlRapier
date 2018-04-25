import * as schema from 'hr.schema';
import * as typeId from 'hr.typeidentifiers';

export interface IViewDataFormatter<T> {
    convert(data: T): Extractor<T>;
}

export interface IViewDataFormatterWithExternal<T> extends IViewDataFormatter<T> {
    handleExternalForRow(data: T, name: string, resolver: IDataResolver): void;
    processedAllRows(): void;
}

export interface Extractor<T> {
    (name: string): any;
    original: T;
};

export interface ISchemaRowArgs {
    prop: schema.JsonProperty;
    schema: schema.JsonSchema;
    propData: any;
    data: any;
    name: string;
    resolver: IDataResolver
}

export interface ISchemaViewFormatterExtension {
    /**
     * Called as each row is added.
     * @param args Event args.
     */
    handleRow<T>(args: ISchemaRowArgs): void;

    /**
     * Called after all rows have been added.
     */
    processedAllRows(): void;
}

var schemaFormatterExtensions: ISchemaViewFormatterExtension[] = [];

export function registerSchemaViewFormatterExtension(builder: ISchemaViewFormatterExtension) {
    schemaFormatterExtensions.push(builder);
}

export interface IDataResolver {
    /**
     * Add a promise to resolve a named property.
     * @param name
     * @param resolver
     */
    addResolver(name: string, resolver: Promise<any>): void;

    /**
     * Get the final resolved data.
     * @param data
     */
    getResolved(): Promise<any>;
}

interface IDataResolverEntry {
    name: string,
    promise: Promise<any>;
}

export class DataResolver<T> implements IDataResolver {
    private promises: IDataResolverEntry[] = [];
    private resolved: T = undefined;

    constructor(private data: T) {

    }

    public addResolver(name: string, resolver: Promise<any>) {
        this.promises.push({
            name: name,
            promise: resolver
        });
    }

    public async getResolved(): Promise<T> {
        if (this.resolved !== undefined) {
            return this.resolved;
        }

        if (this.data === undefined || this.data === null) {
            return this.data;
        }

        if (this.data === undefined) {
            this.data = null;
        }

        var resolutions;

        if (typeId.isFunction(this.data)) {
            resolutions = {};
        }
        else {
            //For objects use Object.create to create another object with the original as its prototype
            resolutions = Object.create(this.data as {});
        }

        for (var i = 0; i < this.promises.length; ++i) {
            var item = this.promises[i];
            resolutions[item.name] = await item.promise;
        }

        if (typeId.isFunction(this.data)) {
            //For functions, wrap the passed function with our own resolutions
            var func = (name) => {
                if (resolutions.hasOwnProperty(name)) {
                    return resolutions[name];
                }
                return (this.data as any)(name);
            };

            this.resolved = func as any;
        }
        else {
            this.resolved = resolutions as T;
        }

        return this.resolved;
    }
}

export class SchemaViewFormatter<T> implements IViewDataFormatterWithExternal<T> {
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
            switch (format) {
                case 'date':
                    var date = new Date(rawData);
                    return date.toLocaleDateString();
                case 'date-time':
                    var date = new Date(rawData);
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

    public handleExternalForRow<T>(data: T, name: string, resolver: IDataResolver): void {
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
            var args: ISchemaRowArgs = {
                data: data,
                name: name,
                prop: prop,
                propData: rawData,
                schema: this.schema,
                resolver: resolver
            }
            for (var i = 0; i < schemaFormatterExtensions.length; ++i) {
                schemaFormatterExtensions[i].handleRow(args);
            }
        }
    }

    public processedAllRows(): void {
        for (var i = 0; i < schemaFormatterExtensions.length; ++i) {
            schemaFormatterExtensions[i].processedAllRows();
        }
    }
}