///<amd-module name="hr.test.textstream"/>

import * as exprTree from 'hr.expressionTree';
import * as textstream from 'hr.textstream';
import { TestContext, getTestRunner } from 'hr.test.TestRunner';

var runner = getTestRunner();
runner.beginTestSection("Text Stream");

runner.runTest("TestReadObject", (ctx: TestContext) => {
    var data = {
        val: 5
    }

    var expression = exprTree.create("val");

    var address = expression.getDataAddress();
    var read = address.read(data);
    ctx.assert(read === data.val, "Value read did not match input value");
});

runner.runTest("TestReadFunction", (ctx: TestContext) => {
    var data = {
        val: 5
    }

    var expression = exprTree.create("val");

    var address = expression.getDataAddress();
    var read = address.read((addr: exprTree.AddressStack) => addr.address.read(data));
    ctx.assert(read === data.val, "Value read did not match input value");
});

runner.runTest("TestSimpleStream", (ctx: TestContext) => {
    var data = {
        val: 5
    }
    var text = "hi";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => "");

    ctx.assert(result === "hi", "Text Stream did not output 'hi'");
});

runner.runTest("TestVariableStream", (ctx: TestContext) => {
    var data = {
        val: 5
    }
    var text = "hi{{val}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "hi5", "Text Stream did not output 'hi5' it was: " + result);
});

runner.runTest("TestComplexVariableStream", (ctx: TestContext) => {
    var data = {
        val: {
            thing: 23
        }
    }
    var text = "hi{{val.thing}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "hi23", "Text Stream did not output 'hi23' it was: " + result);
});

runner.runTest("TestIfRawStream_Pass", (ctx: TestContext) => {
    var data = {
        val: true
    }
    var text = "{{if val}}hi{{/if}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "hi", "Text Stream did not output 'hi' it was: " + result);
});

runner.runTest("TestIfRawStream_Fail", (ctx: TestContext) => {
    var data = {
        val: false
    }
    var text = "{{if val}}hi{{/if}}other text";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "other text", "Text Stream did not output 'other text' it was: " + result);
});

runner.runTest("TestIfRawStreamNegate_Pass", (ctx: TestContext) => {
    var data = {
        val: false
    }
    var text = "{{if !val}}hi{{/if}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "hi", "Text Stream did not output 'hi' it was: " + result);
});

runner.runTest("TestIfElse_If", (ctx: TestContext) => {
    var data = {
        val: true
    }
    var text = "{{if val}}hi{{else}}bye{{/if}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "hi", "Text Stream did not output 'hi' it was: " + result);
});

runner.runTest("TestIfElse_Else", (ctx: TestContext) => {
    var data = {
        val: false
    }
    var text = "{{if val}}hi{{else}}bye{{/if}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "bye", "Text Stream did not output 'bye' it was: " + result);
});

runner.runTest("TestIfElseIfElse_If", (ctx: TestContext) => {
    var data = {
        val: 1
    }
    var text = "{{if val === 1}}if{{else if val === 2}}elseif{{else}}else{{/if}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "if", "Text Stream did not output 'if' it was: " + result);
});

runner.runTest("TestIfElseIfElse_ElseIf", (ctx: TestContext) => {
    var data = {
        val: 2
    }
    var text = "{{if val === 1}}if{{else if val === 2}}elseif{{else}}else{{/if}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "elseif", "Text Stream did not output 'elseif' it was: " + result);
});

runner.runTest("TestIfElseIfElse_Else", (ctx: TestContext) => {
    var data = {
        val: 4
    }
    var text = "{{if val === 1}}if{{else if val === 2}}elseif{{else}}else{{/if}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "else", "Text Stream did not output 'else' it was: " + result);
});

runner.runTest("TestForIn", (ctx: TestContext) => {
    var data = {
        val: [{ num: 1 }, { num: 2 }, { num: 3 }]
    }
    var text = "{{for i in val}}{{i.num}}{{/for}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "123", "Text Stream did not output '123' it was: " + result);
});

runner.runTest("TestForInBaseScope", (ctx: TestContext) => {
    var data = {
        val: [{ num: 1 }, { num: 2 }, { num: 3 }],
        fromBase: "cool"
    }
    var text = "{{for i in val}}{{fromBase}}{{/for}}";
    var stream = new textstream.TextStream(text);
    var result = stream.format(addr => addr.address.read(data));

    ctx.assert(result === "coolcoolcool", "Text Stream did not output 'coolcoolcool' it was: " + result);
});