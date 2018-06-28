///<amd-module name="hr.expressiontree"/>
import * as jsep from 'hr.jsep';
import { Address } from 'cluster';

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
    address?: AddressNode[];
}

export interface IValueSource {
    getValue(address: AddressNode[]): any;
}

export enum AddressNodeType {
    Object,
    Array
}

export interface AddressNode {
    key: string | number;
    type: AddressNodeType;
}

export class ExpressionTree {
    constructor(private root: ExpressionNode) {

    }

    /**
     * Get the root node's data address, can be used to lookup data. If this is undefined
     * then there is no data address for this expression tree and it can't be used to directly
     * look up data.
     */
    public getDataAddress(): AddressNode[] | null {
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

    private getTestKey(node: ExpressionNode): AddressNode[] {
        if (node.address !== undefined) {
            return node.address;
        }
        var ret: AddressNode[] = [];
        ret.push({
            key: Object.keys(node.test)[0],
            type: AddressNodeType.Object
        });
        return ret;
    }

    private getTestValue(node: ExpressionNode, address: AddressNode[]): any {
        if (node.address !== undefined) {
            return node.test['value'];
        }
        return node.test[address[0].key];
    }

    private equals(current: any, test: any): boolean {
        switch (typeof (test)) {
            case "boolean":
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
                console.log(currentAsNum);
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
    '<=': OperationType.GreaterThanOrEqual,
    '>=': OperationType.LessThanOrEqual,
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

    var address: AddressNode[] = undefined;

    switch (jsepNode.type) {
        case "LogicalExpression":
            result.operation = opMap[(<jsep.LogicalExpression>jsepNode).operator];
            result.left = setupNode((<jsep.LogicalExpression>jsepNode).left);
            result.right = setupNode((<jsep.LogicalExpression>jsepNode).right);
            break;
        case "BinaryExpression":
            var literal: jsep.Literal = undefined;
            address = getIdentifierAddress((<jsep.BinaryExpression>jsepNode).left);
            if (address === undefined) {
                if ((<jsep.BinaryExpression>jsepNode).left.type === "Literal") {
                    literal = (<jsep.BinaryExpression>jsepNode).left;
                }
            }
            else {
                address = getIdentifierAddress((<jsep.BinaryExpression>jsepNode).right);
                if ((<jsep.BinaryExpression>jsepNode).right.type === "Literal") {
                    literal = (<jsep.BinaryExpression>jsepNode).left;
                }
            }
            if (literal === undefined || address === undefined) {
                throw new Error("Cannot build valid expression from statement.");
            }
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
            result.test = {};
            result.test['value'] = true;
            result.address = address;
            break;
        case "Identifier":
        case "MemberExpression":
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

function getIdentifierAddress(node: jsep.JsepNode): AddressNode[] {
    switch (node.type) {
        case "Identifier":
            return [{
                key: (<jsep.Identifier>node).name,
                type: AddressNodeType.Object
            }];
        case "MemberExpression":
            return convertMemberExpressionToAddress(<jsep.MemberExpression>node);
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