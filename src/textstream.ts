///<amd-module name="hr.textstream"/>

"use strict";

import {escape} from 'hr.escape';
import * as typeId from 'hr.typeidentifiers';
import * as exprTree from 'hr.expressiontree';
import * as jsep from 'hr.jsep';
import { Iterable } from 'hr.iterable';
import { IDataAddress, AddressStack } from 'hr.expressiontree';

export interface ITextStreamData {
    getRawData(address: exprTree.IDataAddress): any;
    getFormatted(data: any, address: exprTree.IDataAddress): any;
}

class NodeScope {
    constructor(private parent: NodeScope, private scopeName: string, private data: ITextStreamData, private address: IDataAddress | null) {
        parent = parent || null;
    }

    getRawData(address: exprTree.IDataAddress) {
        if (address.isInScope(this.scopeName) || this.parent === null) {
            return this.data.getRawData(address);
        }
        else {
            return this.parent.getRawData(address);
        }
    }

    getFormatted(data: any, address: exprTree.IDataAddress) {
        //Get top parent
        var parent: NodeScope = this;
        while (parent.parent !== null) {
            parent = parent.parent;
        }
        return parent.data.getFormatted(data, address);
    }

    getFullAddress(childAddress?: exprTree.IDataAddress): exprTree.AddressNode[] {
        var address: exprTree.AddressNode[];
        var first = 0;
        if (this.parent !== null) {
            address = this.parent.getFullAddress(this.address);
            first = 1; //In scopes skip the first variable
        }
        else {
            address = [];
        }

        if (childAddress) {
            var childAddrArray = childAddress.address;
            for (var i = first; i < childAddrArray.length; ++i) { 
                address.push(childAddrArray[i]);
            }
        }
        return address;
    }

    public get isTopLevel(): boolean {
        return this.parent === null;
    }
}

interface IStreamNode{
    writeFunction(data: NodeScope);
}

class TextNode implements IStreamNode{
    private parent: IStreamNode;

    constructor(private str: string){

    }

    writeFunction(data: NodeScope){
        return this.str;
    }
}

export class ScopedFullDataAddress implements IDataAddress {
    constructor(private scope: NodeScope, private varAddress: IDataAddress) {

    }

    get address(): exprTree.AddressNode[] {
        //Build complete address, slow for now
        var address = this.scope.getFullAddress(this.varAddress);
        return address;
    }

    read(data: {} | exprTree.AddressStackLookup, startNode?: number) {
        throw new Error("Method not supported.");
    }

    isInScope(scope: string): boolean {
        throw new Error("Method not supported.");
    }

    readScoped(data: {}) {
        throw new Error("Method not supported.");
    }
}

class VariableNode implements IStreamNode {
    private address: exprTree.IDataAddress;
    private parent: IStreamNode;

    constructor(variable: string) {
        var expressionTree = exprTree.create(variable);
        this.address = expressionTree.getDataAddress();
        if (this.address === null) {
            var message = "Expression \"" + variable + "\" is not a valid variable node expression.";
            console.log(message);
            throw new Error(message);
        }
    }

    writeFunction(data: NodeScope) {
        var lookedUp = data.getRawData(this.address);
        var finalAddress = this.address;
        if (!data.isTopLevel) {
            finalAddress = new ScopedFullDataAddress(data, this.address);
        }

        return data.getFormatted(lookedUp, finalAddress);
    }
}

class ReadIfData {
    constructor(protected data: ITextStreamData) { }

    public getValue(address: IDataAddress): any {
        return this.data.getRawData(address);
    }
}

interface IBlockNode extends IStreamNode {
    getStreamNodes();
    checkPopStatement(variable: string);
}

class IfNode implements IBlockNode {
    private parent: IStreamNode;
    private streamNodesPass: IStreamNode[] = [];
    private streamNodesFail: IStreamNode[] = [];
    private expressionTree: exprTree.ExpressionTree;

    constructor(private condition: string) {
        condition = condition.replace(/&gt;/g, ">");
        condition = condition.replace(/&lt;/g, "<");
        condition = condition.replace(/&amp;/g, "&");
        this.expressionTree = exprTree.create(condition);
    }

    writeFunction(data: NodeScope) {
        if (this.expressionTree.isTrue(new ReadIfData(data))) {
            return format(data, this.streamNodesPass);
        }
        else {
            return format(data, this.streamNodesFail);
        }
    }

    public getStreamNodes() {
        return this.streamNodesPass;
    }

    public getFailNodes() {
        return this.streamNodesFail;
    }

    public checkPopStatement(variable: string) {
        if (variable.length === 3 && variable[0] === '/' && variable[1] === 'i' && variable[2] === 'f') {
            return;
        }
        if (variable.length === 1 && variable[0] === '/') {
            return;
        }
        if (variable.length > 4 && variable[0] === '/' && variable[1] === 'i' && variable[2] === 'f' && /\s/.test(variable[3])) {
            return;
        }
        if (isElseIf(variable)) {
            return;
        }
        if (isElse(variable)) {
            return;
        }

        var message = "Invalid closing if statement " + variable;
        console.log(message);
        throw new Error(message);
    }
}

function isElseIf(variable: string): boolean {
    return variable.length > 6 && variable[0] === 'e' && variable[1] === 'l' && variable[2] === 's' && variable[3] === 'e' && /\s/.test(variable[4]) && variable[5] === 'i' && variable[6] === 'f' && /\s/.test(variable[7]);
}

function isElse(variable: string): boolean {
    return variable === 'else';
}

class ForInNode implements IBlockNode {
    private parent: IStreamNode;
    private streamNodes: IStreamNode[] = [];
    private address: exprTree.IDataAddress;
    private scopeName: string;

    constructor(private condition: string) {
        var nodes = jsep.parse(condition);
        if (nodes.type !== "Compound") {
            var message = "Expression \"" + condition + "\" is not a valid for in node expression.";
            console.log(message);
            throw new Error(message);
        }

        if ((<jsep.Compound>nodes).body.length !== 4) {
            var message = "Expression \"" + condition + "\" is not a valid for in node expression.";
            console.log(message);
            throw new Error(message);
        }
        this.scopeName = (<jsep.Identifier>(<jsep.Compound>nodes).body[1]).name;
        var expressionTree = exprTree.createFromParsed((<jsep.Compound>nodes).body[3]);
        this.address = expressionTree.getDataAddress();
        if (this.address === null) {
            var message = "Expression \"" + condition + "\" is not a valid for in node expression.";
            console.log(message);
            throw new Error(message);
        }
    }

    writeFunction(data: NodeScope) {
        var text = "";
        var iter = new Iterable(data.getRawData(this.address));
        var localScopeName = this.scopeName;
        iter.forEach(item => {
            var itemScope = new NodeScope(data, this.scopeName, {
                getRawData: a => a.readScoped(item),
                getFormatted: (d, a) => d //Doesn't really do anything, won't get called
            }, this.address);

            for (var i = 0; i < this.streamNodes.length; ++i) {
                text += this.streamNodes[i].writeFunction(itemScope);
            }
        });
        return text;
    }

    public getStreamNodes() {
        return this.streamNodes;
    }

    public checkPopStatement(variable: string) {
        if (variable.length === 4 && variable[0] === '/' && variable[1] === 'f' && variable[2] === 'o' && variable[3] === 'r') {
            return;
        }
        if (variable.length === 1 && variable[0] === '/') {
            return;
        }
        if (variable.length > 5 && variable[0] === '/' && variable[1] === 'f' && variable[2] === 'o' && variable[3] === 'r' && /\s/.test(variable[4])) {
            return;
        }

        var message = "Invalid closing for statement " + variable;
        console.log(message);
        throw new Error(message);
    }
}

class EscapeVariableNode implements IStreamNode {
    private parent: IStreamNode;

    constructor(private wrapped: IStreamNode){

    }

    writeFunction(data: NodeScope) {
        return escape(this.wrapped.writeFunction(data));
    }
}

var noData: ITextStreamData = {
    getFormatted(val, address) { return val; },
    getRawData(address) { return undefined; }
};

function format(data: ITextStreamData, streamNodes: IStreamNode[]) {
    if (data === null || data === undefined) {
        data = noData;
    }

    var text = "";

    var nodeScope = new NodeScope(null, null, data, null);
    for (var i = 0; i < streamNodes.length; ++i) {
        text += streamNodes[i].writeFunction(nodeScope);
    }

    return text;
}

export interface ITextStreamOptions{
    open?: string;
    close?: string;
    escape?: boolean;
}

class NodeStackItem {
    constructor(public node: IBlockNode, public allowElseMode: boolean) { }
    elseMode: boolean = false;
}

class StreamNodeTracker {
    private blockNodeStack: NodeStackItem[] = [];

    constructor(private baseStreamNodes: IStreamNode[]) {

    }

    public pushIfNode(ifNode: IfNode) {
        this.blockNodeStack.push(new NodeStackItem(ifNode, true));
    }

    public pushBlockNode(blockNode: IBlockNode) {
        this.blockNodeStack.push(new NodeStackItem(blockNode, false));
    }

    public setElseMode() {
        if (this.blockNodeStack.length === 0) {
            var message = "Attempted to else with no current block.";
            console.log(message);
            throw new Error(message);
        }
        var currentIf = this.getCurrentBlock();
        if (!currentIf.allowElseMode) {
            var message = "Attempted to else when the current block does not support else statements.";
            console.log(message);
            throw new Error(message);
        }
        currentIf.elseMode = true;
    }

    public popBlockNode(variable: string) {
        if (this.blockNodeStack.length === 0) {
            var message = "Popped block node without any block statement present. Is there an extra end block or elseif statement?";
            console.log(message);
            throw new Error(message);
        }
        this.getCurrentBlock().node.checkPopStatement(variable);
        this.blockNodeStack.pop();
    }

    public getCurrentStreamNodes() {
        if (this.blockNodeStack.length === 0) {
            return this.baseStreamNodes;
        }
        var block = this.getCurrentBlock();
        if (block.elseMode) {
            return (<IfNode>block.node).getFailNodes();
        }
        return block.node.getStreamNodes();
    }

    public checkError() {
        if (this.blockNodeStack.length > 0) {
            var message = "Blocks still on stack when stream processed. Did you forget a close block somewhere?";
            console.log(message);
            throw new Error(message);
        }
    }

    private getCurrentBlock(): NodeStackItem {
        return this.blockNodeStack[this.blockNodeStack.length - 1];
    }
}

/**
 * Create a text stream that when called with data will output
 * the original string with new data filled out. If the text contains
 * no variables no stream will be created.
 * @param {type} text
 * @returns {type} 
 */
export class TextStream {
    private streamNodes: IStreamNode[] = [];
    private variablesFound = false;

    constructor(text: string, options?: ITextStreamOptions){
        if(options === undefined){
            options = {};
        }

        var open = options.open;
        var close = options.close;
        var escape = options.escape;

        //Escape by default.
        if(escape === undefined){
            escape = true;
        }

        if(open === undefined){
            open = '{';
        }

        if(close === undefined){
            close = '}';
        }

        var textStart = 0;
        var bracketStart = 0;
        var bracketEnd = 0;
        var bracketCount = 0;
        var bracketCheck = 0;
        var leadingText;
        var variable;
        var bracketVariable;
        //This holds text we have not created a TextNode for as we parse, this way we can combine output variables with surrounding text for the stream itself
        var skippedTextBuffer = "";
        var streamNodeTracker = new StreamNodeTracker(this.streamNodes);
        for (var i = 0; i < text.length; ++i) {

            if (text[i] == open) {
                //Count up opening brackets
                bracketStart = i;
                bracketCount = 1;
                while (++i < text.length && text[i] == open) {
                    ++bracketCount;
                }

                //Find closing bracket chain, ignore if mismatched
                bracketCheck = bracketCount;
                while (++i < text.length) {
                    if ((text[i] == close && --bracketCheck == 0)) {
                        break;
                    }
                }

                //If the check got back to 0 we found a variable
                if (bracketCheck == 0) {
                    leadingText = text.substring(textStart, bracketStart);

                    bracketEnd = i;
                    bracketVariable = text.substring(bracketStart, bracketEnd + 1);

                    switch (bracketCount) {
                        case 1:
                            //1 bracket, add to buffer
                            skippedTextBuffer += leadingText + bracketVariable;
                            break;
                        case 2:
                            let currentBracketStreamNodes = streamNodeTracker.getCurrentStreamNodes();
                            currentBracketStreamNodes.push(new TextNode(skippedTextBuffer + leadingText));
                            skippedTextBuffer = ""; //This is reset every time we actually output something
                            variable = bracketVariable.substring(2, bracketVariable.length - 2);
                            var variableNode = null;
                            //See if this is an if node, if so recurse
                            if (variable.length > 2 && variable[0] === 'i' && variable[1] === 'f' && /\s/.test(variable[2])) {
                                variableNode = new IfNode(variable.substring(3));
                                streamNodeTracker.pushIfNode(variableNode);
                            }
                            else if (isElseIf(variable)) {
                                //Set else mode and get the current stream nodes
                                streamNodeTracker.setElseMode();
                                var elseStreamNodes = streamNodeTracker.getCurrentStreamNodes();
                                let ifNode = new IfNode(variable.substring(7));
                                elseStreamNodes.push(ifNode);
                                //Use the new if node as the current top level node in the tracker
                                streamNodeTracker.popBlockNode(variable);
                                streamNodeTracker.pushIfNode(ifNode);
                            }
                            else if (isElse(variable)) {
                                streamNodeTracker.setElseMode();
                            }
                            else if (variable.length > 4 && variable[0] === 'f' && variable[1] === 'o' && variable[2] === 'r' && /\s/.test(variable[3])) {
                                variableNode = new ForInNode(variable);
                                streamNodeTracker.pushBlockNode(variableNode);
                            }
                            else if (variable.length > 0 && variable[0] === '/') {
                                streamNodeTracker.popBlockNode(variable);
                            }
                            //Normal Variable node
                            else {
                                variableNode = new VariableNode(variable);

                                //If we are escaping decorate the variable node we created with the escape version.
                                if (escape) {
                                    variableNode = new EscapeVariableNode(variableNode);
                                }
                            }

                            if (variableNode !== null) {
                                currentBracketStreamNodes.push(variableNode);
                            }

                            break;
                        default:
                            //Multiple brackets, escape by removing one and add to buffer
                            skippedTextBuffer += leadingText + bracketVariable.substring(1, bracketVariable.length - 1);
                            break;
                    }

                    textStart = i + 1;
                    this.variablesFound = true;
                }
            }
        }

        streamNodeTracker.checkError();

        if (textStart < text.length) {
            this.streamNodes.push(new TextNode(skippedTextBuffer + text.substring(textStart, text.length)));
        }
    }

    public format(data: ITextStreamData) {
        return format(data, this.streamNodes);
    }

    public foundVariable() {
        return this.variablesFound;
    }
}