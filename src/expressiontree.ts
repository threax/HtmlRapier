///<amd-module-off name="hr.expressiontree"/>
import * as jsep from './jsep';
import * as typeId from './typeidentifiers';

export enum OperationType {
    And = <any>"And",
    Or = <any>"Or",
    Not = <any>"Not",
    Equal = <any>"Equal",
    NotEqual = <any>"NotEqual",
    GreaterThan = <any>"GreaterThan",
    LessThan = <any>"LessThan",
    GreaterThanOrEqual = <any>"GreaterThanOrEqual",
    LessThanOrEqual = <any>"LessThanOrEqual"
}

export interface ExpressionNode {
    left: ExpressionNode;
    right: ExpressionNode;
    test: { [key: string]: any };
    operation: OperationType;
    address?: IDataAddress;
}

export interface IValueSource {
    getValue(address: IDataAddress): any;
}

export enum AddressNodeType {
    Object,
    Array
}

export interface AddressNode {
    key: string | number;
    type: AddressNodeType;
}

/**
 * Get the address as a string. Array indicies will be included, so foo.bar[5] will returned for an address with object: foo, object: bar array: 5.
 * @param address
 */
export function getAddressString(address: AddressNode[]): string {
    var sep = "";
    var name = "";
    for (var i = 0; i < address.length; ++i) {
        var node = address[i];
        switch (node.type) {
            case AddressNodeType.Object:
                name += sep + address[i].key;
                break;
            case AddressNodeType.Array:
                name += '[' + address[i].key + ']';
                break;
        }
        sep = ".";
    }
    return name;
}

/**
 * Get an address string, but do not include any indicies in arrays, so foo[4] is returned as foo[].
 * This is better if you want to use addresses to lookup cached properties.
 * @param address
 */
export function getAddressStringNoIndicies(address: AddressNode[]): string {
    var sep = "";
    var name = "";
    for (var i = 0; i < address.length; ++i) {
        var node = address[i];
        switch (node.type) {
            case AddressNodeType.Object:
                name += sep + address[i].key;
                break;
            case AddressNodeType.Array:
                name += '[]';
                break;
        }
        sep = ".";
    }
    return name;
}

//export type BaseDataType = (variable: string | number) => any | {};

export interface AddressStack {
    parent: AddressStack;
    data: AddressStackLookup;
    address: IDataAddress;
}

export type AddressStackLookup = (stack: AddressStack) => any;

export interface IDataAddress {
    address: AddressNode[];
    read(data: AddressStackLookup | {}, startNode?: number);
    isInScope(scope: string | null): boolean;
    readScoped(data: {}): any;
}

export class DataAddress implements IDataAddress {
    address: AddressNode[];
    constructor(address: AddressNode[]) {
        this.address = address;
        //Remove any this from the address
        if (address.length > 0 && address[0].key === "this") {
            address.splice(0, 1);
        }
    }

    read(data: AddressStackLookup | {}) {
        if (DataAddress.isAddressStackLookup(data)) {
            return data({
                parent: null,
                data: data,
                address: this
            });
        }
        else {
            return this.readAddress(data, 0);
        }
    }

    public isInScope(scope: string | null): boolean {
        return this.address.length > 0 && this.address[0].key === scope;
    }

    /**
     * Read scoped data, this will skip the first item of the address and will read the reminaing data out
     * of the passed in data. This makes it easy read data that another address looked up in scoped addresses.
     * @param data
     */
    public readScoped(data: {}) {
        if (DataAddress.isAddressStackLookup(data)) {
            throw new Error("Cannot read scoped data from AddressStackLookups");
        }
        return this.readAddress(data, 1);
    }

    private readAddress(value: any, startNode: number): any {
        for (var i = startNode; i < this.address.length && value !== undefined; ++i) {
            var item = this.address[i];
            //Arrays and objects can be read this way, which is all there is right now.
            //Functions are only supported on the top level.
            value = value[item.key];
        }
        return value;
    }

    /**
     * Determine if a data item is an addres stack lookup or a generic object. The only test this does is to see
     * if the incoming type is a function, not reliable otherwise, but helps the compiler.
     * @param data
     */
    private static isAddressStackLookup(data: AddressStackLookup | {}): data is AddressStackLookup {
        if (typeId.isFunction(data)) {
            return true;
        }
        return false;
    }
}

export class ExpressionTree {
    constructor(private root: ExpressionNode) {

    }

    /**
     * Get the root node's data address, can be used to lookup data. If this is undefined
     * then there is no data address for this expression tree and it can't be used to directly
     * look up data.
     */
    public getDataAddress(): IDataAddress | null {
        return this.root.address || null;
    }

    public isTrue(valueSource: IValueSource): boolean {
        return this.evaluate(this.root, valueSource);
    }

    private evaluate(node: ExpressionNode, valueSource: IValueSource): boolean {
        switch (node.operation) {
            case OperationType.And:
                return this.evaluate(node.left, valueSource) && this.evaluate(node.right, valueSource);
            case OperationType.Or:
                return this.evaluate(node.left, valueSource) || this.evaluate(node.right, valueSource);
            case OperationType.Equal:
                var testKey = this.getTestKey(node);
                return this.equals(valueSource.getValue(testKey), this.getTestValue(node, testKey));
            case OperationType.NotEqual:
                var testKey = this.getTestKey(node);
                return !this.equals(valueSource.getValue(testKey), this.getTestValue(node, testKey));
            case OperationType.Not:
                return !this.evaluate(node.left, valueSource);
            case OperationType.GreaterThan:
            case OperationType.GreaterThanOrEqual:
            case OperationType.LessThan:
            case OperationType.LessThanOrEqual:
                var testKey = this.getTestKey(node);
                return this.compare(valueSource.getValue(testKey), this.getTestValue(node, testKey), node.operation);
        }

        return false;
    }

    private getTestKey(node: ExpressionNode): IDataAddress {
        if (node.address !== undefined) {
            return node.address;
        }
        var ret: AddressNode[] = [];
        ret.push({
            key: Object.keys(node.test)[0],
            type: AddressNodeType.Object
        });
        return new DataAddress(ret);
    }

    private getTestValue(node: ExpressionNode, address: IDataAddress): any {
        if (node.address !== undefined) {
            return node.test['value'];
        }
        return node.test[address.address[0].key];
    }

    private equals(current: any, test: any): boolean {
        //Normalize undefined to null, only javascript has the undefined concept and we are consuming generic expressions.
        if (current === undefined) {
            current = null;
        }

        if (current === null) {
            //If current is null, just check it against the test value, there is no need to try to convert test is null or it isn't
            return current === test;
        }

        //This makes sure we are checking current as the same type as test
        switch (typeof (test)) {
            case "boolean":
                if (typeof (current) === "string" && current.toLowerCase !== undefined) { //The toLowerCase check is for chrome, not good enough to just check the types.
                    //Special type conversion for string
                    //Boolean('false') is true, so this looks for true for real
                    current = current.toLowerCase() === 'true';
                }
                return Boolean(current) === test;
            case "number":
                return Number(current) === test;
            case "object":
                if (current === undefined || current === null || current === "") {
                    return test === null; //Current is undefined, null or empty string and test is null, consider equivalent
                }
            case "string":
                return String(current) === test;
        }
        return false; //No match, or type could not be determined
    }

    private compare(current: any, test: any, operation: OperationType): boolean {
        switch (typeof (test)) {
            case "number":
                var currentAsNum = Number(current);
                if (!isNaN(currentAsNum)) {
                    switch (operation) {
                        case OperationType.GreaterThan:
                            return currentAsNum > test;
                        case OperationType.GreaterThanOrEqual:
                            return currentAsNum >= test;
                        case OperationType.LessThan:
                            return currentAsNum < test;
                        case OperationType.LessThanOrEqual:
                            return currentAsNum <= test;
                    }
                }
        }
        return false;
    }
}

//Parse jsep trees to our runnable trees
var opMap: { [key: string]: OperationType } = {
    '||': OperationType.Or,
    '&&': OperationType.And,
    //'|'
    //'^'
    //'&'
    '==': OperationType.Equal,
    '!=': OperationType.NotEqual,
    '===': OperationType.Equal,
    '!==': OperationType.NotEqual,
    '<': OperationType.LessThan,
    '>': OperationType.GreaterThan,
    '<=': OperationType.LessThanOrEqual,
    '>=': OperationType.GreaterThanOrEqual,
    //'<<'
    //'>>'
    //'>>>'
    //'+'
    //'-'
    //'*'
    //'/'
    //'%'
    '!': OperationType.Not
}

export function create(expr: string): ExpressionTree {
    var jsepResult = jsep.parse(expr);
    return new ExpressionTree(setupNode(jsepResult));
}

export function createFromParsed(parsed: jsep.JsepNode): ExpressionTree {
    return new ExpressionTree(setupNode(parsed));
}

function setupNode(jsepNode: jsep.JsepNode): ExpressionNode {
    if (jsepNode === undefined) {
        return undefined;
    }
    var result: ExpressionNode = {
        operation: undefined,
        left: undefined,
        right: undefined,
        test: undefined
    };

    var address: IDataAddress = undefined;

    switch (jsepNode.type) {
        case "LogicalExpression":
            result.operation = opMap[(<jsep.LogicalExpression>jsepNode).operator];
            result.left = setupNode((<jsep.LogicalExpression>jsepNode).left);
            result.right = setupNode((<jsep.LogicalExpression>jsepNode).right);
            break;
        case "BinaryExpression":
            var literal: jsep.Literal = undefined;
            address = getIdentifierAddress((<jsep.BinaryExpression>jsepNode).left);
            if (address !== undefined) {
                if ((<jsep.BinaryExpression>jsepNode).right.type === "Literal") {
                    literal = (<jsep.BinaryExpression>jsepNode).right;
                }
            }
            else {
                address = getIdentifierAddress((<jsep.BinaryExpression>jsepNode).right);
                if ((<jsep.BinaryExpression>jsepNode).left.type === "Literal") {
                    literal = (<jsep.BinaryExpression>jsepNode).left;
                }
            }
            if (literal === undefined || address === undefined) {
                throw new Error("Cannot build valid expression from statement.");
            }
            result.operation = opMap[(<jsep.LogicalExpression>jsepNode).operator];
            result.test = {};
            result.test['value'] = literal.value;
            result.address = address;
            break;
        case "UnaryExpression":
            if ((<jsep.UnaryExpression>jsepNode).operator !== '!') {
                throw new Error("Cannot support unary operations that are not not (!).")
            }
            address = getIdentifierAddress((<jsep.UnaryExpression>jsepNode).argument);
            if (address === undefined) {
                throw new Error("Cannot build valid expression from statement.");
            }
            result.operation = OperationType.Not;
            result.left = {
                operation: OperationType.Equal,
                left: undefined,
                right: undefined,
                test: undefined
            };
            result.left.test = {};
            result.left.test['value'] = true;
            result.left.address = address;
            break;
        case "Identifier":
        case "MemberExpression":
        case "ThisExpression":
            address = getIdentifierAddress(jsepNode);
            if (address === undefined) {
                throw new Error("Cannot build valid expression from statement.");
            }
            result.operation = OperationType.Equal;
            result.test = {};
            result.test['value'] = true;
            result.address = address;
            break;
    }

    return result;
}

function getIdentifierAddress(node: jsep.JsepNode): IDataAddress {
    var addrNodes: AddressNode[] = null;
    switch (node.type) {
        case "ThisExpression":
            addrNodes = [];
            break;
        case "Identifier":
            addrNodes = [{
                key: (<jsep.Identifier>node).name,
                type: AddressNodeType.Object
            }];
            break;
        case "MemberExpression":
            addrNodes = convertMemberExpressionToAddress(<jsep.MemberExpression>node);
            break;
    }
    if (addrNodes !== null) {
        return new DataAddress(addrNodes);
    }
    return undefined;
}

function convertMemberExpressionToAddress(node: jsep.MemberExpression): AddressNode[] {

    switch (node.object.type) {
        case "Identifier":
            var result: AddressNode[] = [{
                key: node.object.name,
                type: AddressNodeType.Object
            }];
            result.push(readMemberExpressionProperty(node));
            return result;
        case "MemberExpression":
            var result = convertMemberExpressionToAddress(node);
            result.push(readMemberExpressionProperty(node));
            return result;
    }
}

function readMemberExpressionProperty(node: jsep.MemberExpression): AddressNode {
    var ret: AddressNode = {
        type: AddressNodeType.Object,
        key: undefined
    }
    if (node.computed) {
        ret.type = AddressNodeType.Array;
    }
    switch (node.property.type) {
        case "Literal":
            ret.key = (<jsep.Literal>node.property).value;
            break;
        case "Identifier":
            ret.key = (<jsep.Identifier>node.property).name;
            break;
    }

    return ret;
}