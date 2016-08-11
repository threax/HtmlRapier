"use strict";

jsns.define("htmlrest.textstream", [
    "htmlrest.escape",
    "htmlrest.typeidentifiers"
],
function (exports, module, escape, typeId) {

    function TextNode(str) {
        this.writeObject = function (data) {
            return str;
        }

        this.writeFunction = this.writeObject;
    }

    function VariableNode(variable) {
        this.writeObject = function (data) {
            return escape(data[variable]);
        }

        this.writeFunction = function (data) {
            return escape(data(variable));
        }
    }

    function ThisVariableNode() {
        this.writeObject = function (data) {
            return escape(data);
        }

        this.writeFunction = function (data) {
            return escape(data('this'));
        }
    }

    function format(data, streamNodes) {
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
     * @param {type} alwaysCreate
     * @returns {type} 
     */
    function TextStream(text) {
        var streamNodes = [];
        var foundVariable = false;

        var textStart = 0;
        var bracketStart = 0;
        var bracketEnd = 0;
        var bracketCount = 0;
        var bracketCheck = 0;
        var leadingText;
        var variable;
        var bracketVariable;
        for (var i = 0; i < text.length; ++i) {

            if (text[i] == '{') {
                //Count up opening brackets
                bracketStart = i;
                bracketCount = 1;
                while (++i < text.length && text[i] == '{') {
                    ++bracketCount;
                }

                //Find closing bracket chain, ignore if mismatched or whitespace
                bracketCheck = bracketCount;
                while (++i < text.length) {
                    if ((text[i] == '}' && --bracketCheck == 0) || /\s/.test(text[i])) {
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
                            //1 bracket, output as is
                            streamNodes.push(new TextNode(leadingText + bracketVariable));
                            break;
                        case 2:
                            streamNodes.push(new TextNode(leadingText));
                            variable = bracketVariable.substring(2, bracketVariable.length - 2);
                            if (variable === "this") {
                                streamNodes.push(new ThisVariableNode());
                            }
                            else {
                                streamNodes.push(new VariableNode(variable));
                            }
                            break;
                        default:
                            //Multiple brackets, escape by removing one
                            streamNodes.push(new TextNode(leadingText + bracketVariable.substring(1, bracketVariable.Length - 2)));
                            break;
                    }

                    textStart = i + 1;
                    foundVariable = true;
                }
            }
        }

        if (textStart < text.length) {
            streamNodes.push(new TextNode(text.substring(textStart, text.length)));
        }

        this.format = function (data) {
            return format(data, streamNodes);
        }

        this.foundVariable = function () {
            return foundVariable;
        }
    }
    module.exports = TextStream;
});