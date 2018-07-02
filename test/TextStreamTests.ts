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

    var address = new textstream.DataAddress(expression.getDataAddress());
    var read = address.read(data);
    ctx.assert(read === data.val, "Value read did not match input value");
});