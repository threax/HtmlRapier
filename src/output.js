"use strict";

jsns.define("htmlrest.output", function (using) {
    var exports = {};

    /**
     * Go through text and identify all the 
     * @param {string} text - The text to format, find {varName} blocks and call the callback with the associated variable name.
     * @param {function} callback - The function to call when a variable name is found.
     */
    exports.iterateVars = function (text, callback) {
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

    return exports;
});