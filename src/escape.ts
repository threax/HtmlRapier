///<amd-module-off name="hr.escape"/>

"use strict";

/**
 * Escape text to prevent html characters from being output. Helps prevent xss, called automatically
 * by formatText, if it is configured to escape. If you manually write user data consider using this 
 * function to escape it, but it is not needed using other HtmlRapier functions like repeat, createComponent 
 * or formatText. This escape function should be good enough to write html including attributes with ", ', ` or no quotes
 * but probably not good enough for css or javascript. Since separating these is the major goal of this library writing
 * out javascript or html with this method will not be supported and could be unsafe.
 * 
 * TL, DR: Only for HTML, not javascript or css, escapes &, <, >, ", ', `, , !, @, $, %, (, ), =, +, {, }, [, and ]
 * @param {string} text - the text to escape.
 * @returns {type} - The escaped version of text.
 */
export function escape(text) {
    text = String(text);

    var status =
        {
            textStart: 0,
            bracketStart: 0,
            output: ""
        }
    for (var i = 0; i < text.length; ++i) {
        switch (text[i]) {
            case '&':
                outputEncoded(i, text, status, '&amp;');
                break;
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
            case '`':
                outputEncoded(i, text, status, '&#96;');
                break;
            case ' ':
                outputEncoded(i, text, status, '&#32;');
                break;
            case '!':
                outputEncoded(i, text, status, '&#33;');
                break;
            case '@':
                outputEncoded(i, text, status, '&#64;');
                break;
            case '$':
                outputEncoded(i, text, status, '&#36;');
                break;
            case '%':
                outputEncoded(i, text, status, '&#37;');
                break;
            case '(':
                outputEncoded(i, text, status, '&#40;');
                break;
            case ')':
                outputEncoded(i, text, status, '&#41;');
                break;
            case '=':
                outputEncoded(i, text, status, '&#61;');
                break;
            case '+':
                outputEncoded(i, text, status, '&#43;');
                break;
            case '{':
                outputEncoded(i, text, status, '&#123;');
                break;
            case '}':
                outputEncoded(i, text, status, '&#125;');
                break;
            case '[':
                outputEncoded(i, text, status, '&#91;');
                break;
            case ']':
                outputEncoded(i, text, status, '&#93;');
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
function outputEncoded(i, text, status, replacement) {
    status.bracketStart = i;
    status.output += text.substring(status.textStart, status.bracketStart) + replacement;
    status.textStart = i + 1;
}