"use strict";

jsns.define("hr.escape", null,
function(exports, module){
    /**
     * Escape text to prevent html characters from being output. Helps prevent xss, called automatically
     * by formatText. If you manually write user data consider using this function to escape it, but it is
     * not needed using other HtmlRapier functions like repeat, createComponent or formatText.
     * @param {string} text - the text to escape.
     * @returns {type} - The escaped version of text.
     */
    function escape(text) {
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
                    outputEncoded(i, text, status, '&lt;');
                    break;
                case '>':
                    outputEncoded(i, text, status, '&gt;');
                    break;
                case '"':
                    outputEncoded(i, text, status, '&quot;');
                    break;
                case '\'':
                    outputEncoded(i, text, status, '&#39;');
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
    module.exports = escape;

    //Helper function for escaping
    function outputEncoded(i, text, status, replacement) {
        status.bracketStart = i;
        status.output += text.substring(status.textStart, status.bracketStart) + replacement;
        status.textStart = i + 1;
    }
});