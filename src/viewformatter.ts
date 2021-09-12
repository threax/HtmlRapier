import * as schema from './schema';
import * as typeId from './typeidentifiers';
import * as exprTree from './expressiontree';
import { ITextStreamData } from './textstream';
import * as schemaprocessor from './schemaprocessor';

declare var moment;

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
    private cachedProperties = {};

    constructor(private schema: schema.JsonSchema) {

    }

    public convert(data: T): Extractor<T> {
        return new SchemaViewExtractor(this, data, this.schema, this.cachedProperties);
    }
}

class SchemaViewExtractor<T> implements Extractor<T> {
    constructor(private dataFormatter: IViewDataFormatter<T>, public original: T, private schema: schema.JsonSchema, private cachedProperties) { }

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

            var values = prop.buildValues;
            if (values !== undefined && Array.isArray(values)) {
                for (var i = 0; i < values.length; ++i) {
                    if (values[i].value == rawData) {
                        return values[i].label;
                    }
                }
            }

            //Check for dates, come in a couple ways
            if (rawData !== null) {
                switch (prop.buildType) {
                    case 'currency':
                        var xUi = <any>prop.xUi;
                        var formatter = new Intl.NumberFormat(xUi.locale, {
                            style: 'currency',
                            currency: xUi.currency
                        });
                        return formatter.format(rawData);
                    case 'date':
                        var date = new Date(rawData);
                        return date.toLocaleDateString();
                    case 'date-time':
                        var xUi = <any>prop.xUi;
                        if (xUi && xUi.dataTimezone) {
                            if (moment && moment.tz) {
                                //Schema provided a display timezone
                                if (xUi.displayTimezone) {
                                    moment.tz.setDefault(xUi.dataTimezone);
                                    rawData = moment(rawData).tz(xUi.displayTimezone).format('YYYY-MM-DD[T]HH:mm:ss');
                                    moment.tz.setDefault();
                                }
                                //Schema did not provide a timezone, guess the browser's time.
                                else {
                                    var displayTimezone = moment.tz.guess();
                                    if (displayTimezone) {
                                        moment.tz.setDefault(xUi.dataTimezone);
                                        rawData = moment(rawData).tz(displayTimezone).format('YYYY-MM-DD[T]HH:mm:ss');
                                        moment.tz.setDefault();
                                    }
                                    else {
                                        console.warn("Cannot determine browser's timezone. Times will not be localized.");
                                    }
                                }
                            }
                            else {
                                console.warn("The date element specified a timezone, but moment-timezone.js is not loaded. Times will not be localized.");
                            }
                        }

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

    private findSchemaProperty(rootSchema: schema.JsonSchema, prop: schema.JsonProperty, name: string | number): schema.JsonProperty {
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

    private getPropertyForAddress(rootSchema: schema.JsonSchema, address: exprTree.AddressNode[]): schemaprocessor.ProcessedJsonProperty {
        var addressName = exprTree.getAddressStringNoIndicies(address);
        var retProp: schemaprocessor.ProcessedJsonProperty = this.cachedProperties[addressName];
        if (retProp === undefined) {
            var prop: schema.JsonProperty = rootSchema.properties[address[0].key];
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
            retProp = schemaprocessor.processProperty(prop, rootSchema, null, null, null);
            this.cachedProperties[addressName] = retProp;
        }
        return retProp;
    }
}