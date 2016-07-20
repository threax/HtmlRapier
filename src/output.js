"use strict";

(function () {
    /**
     * Create a text stream that when called with data will output
     * the original string with new data filled out. If the text contains
     * no variables no stream will be created.
     * @param {type} text
     * @param {type} alwaysCreate
     * @returns {type} 
     */
    htmlrest.textStream = (function () {
        function TextNode(str) {
            this.write = function (data) {
                return str;
            }
        }

        function VariableNode(variable) {
            this.write = function (data) {
                return htmlrest.safetyEscape(data[variable]);
            }
        }

        function ThisVariableNode() {
            this.write = function (data) {
                return htmlrest.safetyEscape(data);
            }
        }

        function format(data, streamNodes) {
            var text = "";
            for (var i = 0; i < streamNodes.length; ++i) {
                text += streamNodes[i].write(data);
            }
            return text;
        }

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

            this.foundVariable = function(){
                return foundVariable;
            }
        }
    })();

    /**
     * Go through text and identify all the 
     * @param {string} text - The text to format, find {varName} blocks and call the callback with the associated variable name.
     * @param {function} callback - The function to call when a variable name is found.
     */
    htmlrest.iterateVars = function (text, callback) {
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
                            var variableName = text.substring(bracketStart + 1, bracketEnd);
                            callback(variableName);
                        }
                    }
                    break;
            }
        }
    }

    /**
     * Escape text to prevent html characters from being output. Helps prevent xss, called automatically
     * by formatText. If you manually write user data consider using this function to escape it, but it is
     * not needed using other htmlrest functions like repeat, createComponent or formatText.
     * @param {string} text - the text to escape.
     * @returns {type} - The escaped version of text.
     */
    htmlrest.safetyEscape = function (text) {
        text = String(text);

        var status =
        {
            textStart: 0,
            bracketStart: 0,
            output: ""
        }
        for (var i = 0; i < text.length; ++i) {
            switch (text[i]) {
                case '<':
                    htmlrest.safetyEscape.prototype.outputEncoded(i, text, status, '&lt;');
                    break;
                case '>':
                    htmlrest.safetyEscape.prototype.outputEncoded(i, text, status, '&gt;');
                    break;
                case '"':
                    htmlrest.safetyEscape.prototype.outputEncoded(i, text, status, '&quot;');
                    break;
                case '\'':
                    htmlrest.safetyEscape.prototype.outputEncoded(i, text, status, '&#39;');
                    break;
                default:
                    break;
            }
        }

        if (status.textStart < text.length) {
            status.output += text.substring(status.textStart, text.length);
        }

        return status.output;
    }

    //Helper function for escaping
    htmlrest.safetyEscape.prototype.outputEncoded = function (i, text, status, replacement) {
        status.bracketStart = i;
        status.output += text.substring(status.textStart, status.bracketStart) + replacement;
        status.textStart = i + 1;
    }
})();