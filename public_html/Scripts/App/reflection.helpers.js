function parseFunctionNameFromDefinition(definitionCode) {
    var results = definitionCode.match(new RegExp('function (.*?)[\(]'));
    var functionName = results[1].trim();
    if (!functionName || functionName.indexOf(' ') > -1) {
        throw 'Error: invalid function name.';
    }
    return functionName;
}

function parseParamsString(definitionCode) {
    var results = definitionCode.match(new RegExp('function [a-zA-Z0-9_]+[ ]*[\(](.*?)[\)]'));
    return results[1].trim().replace(/ /g, '');
}

function parseFunctionBody(definitionCode) {
    var bodyStartIndex = definitionCode.indexOf('{');
    var bodyEndIndex = definitionCode.lastIndexOf('}');
    if (bodyStartIndex === -1 || bodyEndIndex === -1) {
        throw 'Error: invalid function definition.';
    }
    return definitionCode.substr(bodyStartIndex + 1, bodyEndIndex - bodyStartIndex - 1);
}

function parseFunctionNameFromInvocation(invocationCode) {
    var index = invocationCode.indexOf('(');
    var functionName = invocationCode.substr(0, index).trim();
    if (!functionName || functionName.indexOf(' ') > -1) {
        throw 'Error: invalid function name.';
    }
    return functionName;
}

function parseArgumentsArray(invocationCode) {
    var openingParenthesesCount = invocationCode.split('(').length - 1;
    var closingParenthesesCount = invocationCode.split(')').length - 1;
    if (openingParenthesesCount !== 1 || closingParenthesesCount !== 1) {
        throw 'Error: invalid invocation code.';
    }
    var openingIndex = invocationCode.indexOf('(');
    var closingIndex = invocationCode.indexOf(')');
    if (openingIndex > closingIndex) {
        throw 'Error: invalid invocation code.';
    }
    var argsString = invocationCode.substr(openingIndex + 1, closingIndex - openingIndex - 1).trim().replace(/ /g, '');
    var argsStrArray = argsString.split(',').filter(function (item) {
        return item;
    });
    return $.map(argsStrArray, function (argument) {
        return JSON.parse('{ "val": ' + escapeQuotes(argument) + ' }').val
    });
}
