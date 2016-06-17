//Output Function
htmlrest.formatText = function (text, args)
{
    if (!text || !args)
    {
        return text;
    }

    var output = "";
    var textStart = 0;
    var bracketStart = 0;
    var bracketEnd = 0;
    for (var i = 0; i < text.length; ++i)
    {
        switch (text[i])
        {
            case '{':
                if (text[i + 1] != '{')
                {
                    bracketStart = i;
                }
                break;
            case '}':
                if (i + 1 == text.length || text[i + 1] != '}')
                {
                    bracketEnd = i;

                    if (bracketStart < bracketEnd - 1)
                    {
                        output += text.substring(textStart, bracketStart);
                        output += htmlrest.safetyEscape(args[text.substring(bracketStart + 1, bracketEnd)]);
                        textStart = i + 1;
                    }
                }
                break;
        }
    }

    if (textStart < text.length)
    {
        output += text.substring(textStart, text.length);
    }

    return output;
}

htmlrest.safetyEscape = function (text)
{
    text = String(text);

    var status =
    {
        textStart: 0,
        bracketStart: 0,
        output: ""
    }
    for (var i = 0; i < text.length; ++i)
    {
        switch (text[i])
        {
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

    if (status.textStart < text.length)
    {
        status.output += text.substring(status.textStart, text.length);
    }

    return status.output;
}

htmlrest.safetyEscape.prototype.outputEncoded = function (i, text, status, replacement)
{
    status.bracketStart = i;
    status.output += text.substring(status.textStart, status.bracketStart) + replacement;
    status.textStart = i + 1;
}