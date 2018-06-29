///<amd-module name="hr.textstream"/>

"use strict";

import {escape} from 'hr.escape';
import * as typeId from 'hr.typeidentifiers';
import * as exprTree from 'hr.expressiontree';
import * as jsep from 'hr.jsep';
import { Iterable } from 'hr.iterable';

interface IStreamNode{
    writeFunction(data: (variable: string) => any);
    writeObject(data: any);
}

class TextNode implements IStreamNode{
    constructor(private str: string){

    }

    writeObject(data: any) {
        return this.str;
    }

    writeFunction(data: (variable: string) => any){
        return this.writeObject(data);
    }
}

class VariableNode implements IStreamNode {
    private address: exprTree.AddressNode[] = [];

    constructor(variable: string) {
        var expressionTree = exprTree.create(variable);
        this.address = expressionTree.getDataAddress();
        if (this.address === null) {
            var message = "Expression \"" + variable + "\" is not a valid variable node expression.";
            console.log(message);
            throw new Error(message);
        }
    }

    writeObject(data: any) {
        return readAddress(this.address, data[this.address[0].key]);
    }

    writeFunction(data: (variable: string) => any) {
        return readAddress(this.address, data(<string>this.address[0].key));
    }
}

class ThisVariableNode implements IStreamNode {
    constructor(){

    }

    writeObject(data: any) {
        return data;
    }

    writeFunction(data: (variable: string) => any){
        return data('this');
    }
}

function readAddress(address: exprTree.AddressNode[], value: any): any {
    for (var i = 1; i < address.length && value !== undefined; ++i) {
        var item = address[i];
        //arrays and objects can be read this way, which is all there is right now
        value = value[item.key];
    }
    return value;
}

class ReadDataObject{
    constructor(protected data: any) { }

    public getValue(address: exprTree.AddressNode[]): any {
        return readAddress(address, this.data[address[0].key]);
    }
}

class ReadDataFunction {
    constructor(protected data: (variable: string | number) => any) { }

    public getValue(address: exprTree.AddressNode[]): any {
        return readAddress(address, this.data(address[0].key));
    }
}

interface IBlockNode extends IStreamNode {
    getStreamNodes();
}

class IfNode implements IBlockNode{
    private streamNodesPass: IStreamNode[] = [];
    private streamNodesFail: IStreamNode[] = [];
    private expressionTree: exprTree.ExpressionTree;

    constructor(private condition: string) {
        this.expressionTree = exprTree.create(condition);
    }

    writeObject(data: any) {
        if (this.expressionTree.isTrue(new ReadDataObject(data))) {
            return format(data, this.streamNodesPass);
        }
        else {
            return format(data, this.streamNodesFail);
        }
    }

    writeFunction(data: (variable: string) => any) {
        if (this.expressionTree.isTrue(new ReadDataFunction(data))) {
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
}

class ForInNode implements IBlockNode {
    private streamNodes: IStreamNode[] = [];
    private address: exprTree.AddressNode[] = [];
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

    writeObject(data: any) {
        var text = "";
        var iter = new Iterable(readAddress(this.address, data[this.address[0].key]));
        iter.forEach(item => {
            for (var i = 0; i < this.streamNodes.length; ++i) {
                var processItem = l => {
                    if (l === this.scopeName) {
                        return item;
                    }
                    else {
                        return data[l];
                    }
                };

                text += this.streamNodes[i].writeFunction(processItem);
            }
        });
        return text;
    }

    writeFunction(data: (variable: string) => any) {
        var text = "";
        var iter = new Iterable(readAddress(this.address, data(<string>this.address[0].key)));
        iter.forEach(item => {
            for (var i = 0; i < this.streamNodes.length; ++i) {
                var processItem = l => {
                    if (l === this.scopeName) {
                        return item;
                    }
                    else {
                        return data(l);
                    }
                };

                text += this.streamNodes[i].writeFunction(processItem);
            }
        });
        return text;
    }

    public getStreamNodes() {
        return this.streamNodes;
    }
}

class EscapeVariableNode implements IStreamNode {
    constructor(private wrapped: IStreamNode){

    }

    writeObject(data: any) {
        return escape(this.wrapped.writeObject(data));
    }

    writeFunction(data: (variable: string) => any){
        return escape(this.wrapped.writeFunction(data));
    }
}

function format(data: any, streamNodes: IStreamNode[]) {
    if (data === null || data === undefined) {
        data = {};
    }

    var text = "";

    if (typeId.isFunction(data)) {
        for (var i = 0; i < streamNodes.length; ++i) {
            text += streamNodes[i].writeFunction(data);
        }
    }
    else {
        for (var i = 0; i < streamNodes.length; ++i) {
            text += streamNodes[i].writeObject(data);
        }
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

    public pushBlockNode(ifNode: IBlockNode) {
        this.blockNodeStack.push(new NodeStackItem(ifNode, false));
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

    public popBlockNode() {
        if (this.blockNodeStack.length === 0) {
            var message = "Popped block node without any block statement present. Is there an extra end block or elseif statement?";
            console.log(message);
            throw new Error(message);
        }
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
                            else if (variable.length > 6 && variable[0] === 'e' && variable[1] === 'l' && variable[2] === 's' && variable[3] === 'e' && variable[4] === 'i' && variable[5] === 'f' && /\s/.test(variable[6])) {
                                //Set else mode and get the current stream nodes
                                streamNodeTracker.setElseMode();
                                var elseStreamNodes = streamNodeTracker.getCurrentStreamNodes();
                                let ifNode = new IfNode(variable.substring(7));
                                elseStreamNodes.push(ifNode);
                                //Use the new if node as the current top level node in the tracker
                                streamNodeTracker.popBlockNode();
                                streamNodeTracker.pushBlockNode(ifNode);
                            }
                            else if (variable === 'else') {
                                streamNodeTracker.setElseMode();
                            }
                            else if (variable.length > 4 && variable[0] === 'f' && variable[1] === 'o' && variable[2] === 'r' && /\s/.test(variable[3])) {
                                variableNode = new ForInNode(variable);
                                streamNodeTracker.pushBlockNode(variableNode);
                            }
                            else if (variable.length > 0 && variable[0] === '/') {
                                streamNodeTracker.popBlockNode();
                            }
                            //Normal Variable node
                            else {
                                if (variable === "this") {
                                    variableNode = new ThisVariableNode();
                                }
                                else {
                                    variableNode = new VariableNode(variable);
                                }

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

    public format(data) {
        return format(data, this.streamNodes);
    }

    public foundVariable() {
        return this.variablesFound;
    }
}