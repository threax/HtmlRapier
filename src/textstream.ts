///<amd-module name="hr.textstream"/>

"use strict";

import {escape} from 'hr.escape';
import * as typeId from 'hr.typeidentifiers';

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
    constructor(private variable: string){

    }

    writeObject(data: any) {
        return escape(data[this.variable]);
    }

    writeFunction(data: (variable: string) => any){
        return escape(data(this.variable));
    }
}

class ThisVariableNode {
    constructor(){

    }

    writeObject(data: any) {
        return escape(data);
    }

    writeFunction(data: (variable: string) => any){
        return escape(data('this'));
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

    constructor(text: string, open?: string, close?: string){
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
        for (var i = 0; i < text.length; ++i) {

            if (text[i] == open) {
                //Count up opening brackets
                bracketStart = i;
                bracketCount = 1;
                while (++i < text.length && text[i] == open) {
                    ++bracketCount;
                }

                //Find closing bracket chain, ignore if mismatched or whitespace
                bracketCheck = bracketCount;
                while (++i < text.length) {
                    if ((text[i] == close && --bracketCheck == 0) || /\s/.test(text[i])) {
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
                            this.streamNodes.push(new TextNode(skippedTextBuffer + leadingText));
                            skippedTextBuffer = ""; //This is reset every time we actually output something
                            variable = bracketVariable.substring(2, bracketVariable.length - 2);
                            if (variable === "this") {
                                this.streamNodes.push(new ThisVariableNode());
                            }
                            else {
                                this.streamNodes.push(new VariableNode(variable));
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