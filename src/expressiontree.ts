///<amd-module name="hr.expressiontree"/>
import * as jsep from 'hr.jsep';

export enum OperationType
{
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
    test: {[key: string]: any};
    operation: OperationType;
}

export interface IValueSource {
    getValue(name: string): any;
}

export class ObjectValueSource implements IValueSource {
    constructor(private source: any) {

    }

    getValue(name: string): any{
        return this.source[name];
    }
}

export class ExpressionTree {
    constructor(private root: ExpressionNode){

    }

    public isTrue(test: IValueSource): boolean{
        return this.evaluate(this.root, test);
    }

    private evaluate(node: ExpressionNode, test: IValueSource): boolean {
        switch (node.operation) {
            case OperationType.And:
                return this.evaluate(node.left, test) && this.evaluate(node.right, test);
            case OperationType.Or:
                return this.evaluate(node.left, test) || this.evaluate(node.right, test);
            case OperationType.Equal:
                var testKey = Object.keys(node.test)[0];
                return this.equals(test.getValue(testKey), node.test[testKey]);
            case OperationType.NotEqual:
                var testKey = Object.keys(node.test)[0];
                return !this.equals(test.getValue(testKey), node.test[testKey]);
            case OperationType.Not:
                return !this.evaluate(node.left, test);
            case OperationType.GreaterThan:
            case OperationType.GreaterThanOrEqual:
            case OperationType.LessThan:
            case OperationType.LessThanOrEqual:
                var testKey = Object.keys(node.test)[0];
                return this.compare(test.getValue(testKey), node.test[testKey], node.operation);
        }

        return false;
    }

    private equals(current: any, test: any): boolean{
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

function setupNode(jsepNode: jsep.Parsed): ExpressionNode {
    if (jsepNode === undefined) {
        return undefined;
    }
    var result: ExpressionNode = {
        operation: opMap[jsepNode.operator],
        left: undefined,
        right: undefined,
        test: undefined
    };
    switch (jsepNode.type) {
        case "LogicalExpression":
            result.left = setupNode(jsepNode.left);
            result.right = setupNode(jsepNode.right);
            break;
        case "BinaryExpression":
            let literal = undefined;
            let identifier = undefined;
            switch (jsepNode.left.type) {
                case "Identifier":
                    identifier = jsepNode.left.name;
                    break;
                case "Literal":
                    literal = jsepNode.left.value;
                    break;
            }
            switch (jsepNode.right.type) {
                case "Identifier":
                    identifier = jsepNode.right.name;
                    break;
                case "Literal":
                    literal = jsepNode.right.value;
                    break;
            }
            if (literal === undefined || identifier === undefined) {
                throw new Error("Cannot build valid expression from statement.");
            }
            result.test = {};
            result.test[identifier] = literal;
            break;
        case "UnaryExpression":
            identifier = jsepNode.argument.name;
            if (identifier === undefined) {
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
            result.left.test[identifier] = true;
            break;
        case "Identifier":
            identifier = jsepNode.name;
            if (identifier === undefined) {
                throw new Error("Cannot build valid expression from statement.");
            }
            result.operation = OperationType.Equal;
            result.test = {};
            result.test[identifier] = true;
            //If we got a plain identifier, consider it to be a statement checking for true
    }

    return result;
}