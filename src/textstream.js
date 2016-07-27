"use strict";

jsns.define("htmlrest.textstream", [
    "htmlrest.escape",
    "htmlrest.typeidentifiers"
],
function(exports, module, escape, typeId){

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

        this.writeFunction = function(data){
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
    module.exports = TextStream;
});