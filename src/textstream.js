"use strict";

jsns.define("htmlrest.textstream", function (using) {
    var escape = using("htmlrest.escape");

    function TextNode(str) {
        this.write = function (data) {
            return str;
        }
    }

    function VariableNode(variable) {
        this.write = function (data) {
            if (data) {
                return escape(data[variable]);
            }
            return "";
        }
    }

    function ThisVariableNode() {
        this.write = function (data) {
            if (data) {
                return escape(data);
            }
            return "";
        }
    }

    function format(data, streamNodes) {
        var text = "";
        for (var i = 0; i < streamNodes.length; ++i) {
            text += streamNodes[i].write(data);
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
    return function (text) {
        var streamNodes = [];
        var foundVariable = false;

        var textStart = 0;
        var bracketStart = 0;
        var bracketEnd = 0;
        for (var i = 0; i < text.length; ++i) {
            switch (text[i]) {
                case '{':
                    if (text[i + 1] !== '{') {
                        bracketStart = i;
                    }
                    break;
                case '}':
                    if (i + 1 === text.length || text[i + 1] !== '}') {
                        bracketEnd = i;

                        if (bracketStart < bracketEnd - 1) {
                            streamNodes.push(new TextNode(text.substring(textStart, bracketStart)));
                            var variableName = text.substring(bracketStart + 1, bracketEnd);
                            if (variableName === "this") {
                                streamNodes.push(new ThisVariableNode());
                            }
                            else {
                                streamNodes.push(new VariableNode(variableName));
                            }
                            textStart = i + 1;
                            foundVariable = true;
                        }
                    }
                    break;
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
});