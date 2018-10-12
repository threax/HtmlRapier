///<amd-module name="hr.test.expressionTree"/>

import * as exprTree from 'hr.expressionTree';
import * as textstream from 'hr.textstream';
import { TestContext, setupTests } from 'hr.test.UnitTests';
import * as controller from 'hr.controller';
import { IViewDataFormatter, Extractor } from 'hr.view';
import { Iterable } from 'hr.iterable';

var runner = setupTests();
runner.beginTestSection("ExpressionTree");

class SimpleValueSource implements exprTree.IValueSource {
    constructor(private data: {}) {

    }

    public getValue(address: exprTree.IDataAddress): any {
        return address.read(this.data);
    }
}

runner.runTest("val('hello') != null", c => {
    var data = new SimpleValueSource({
        val: "hello"
    });
    var tree = exprTree.create("val != null");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val('hello') == null", c => {
    var data = new SimpleValueSource({
        val: "hello"
    });
    var tree = exprTree.create("val == null");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(null) != null", c => {
    var data = new SimpleValueSource({
        val: null
    });
    var tree = exprTree.create("val != null");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(null) == null", c => {
    var data = new SimpleValueSource({
        val: null
    });
    var tree = exprTree.create("val == null");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val('hello') == \"hello\"", c => {
    var data = new SimpleValueSource({
        val: "hello"
    });
    var tree = exprTree.create("val == \"hello\"");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val('hello') != \"hello\"", c => {
    var data = new SimpleValueSource({
        val: "hello"
    });
    var tree = exprTree.create("val != \"hello\"");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(1) == \"1\"", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val == \"1\"");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(1) != \"1\"", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val != \"1\"");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(1) == 1", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val == 1");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(1) != 1", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val != 1");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(1) != \"0\"", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val != \"0\"");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(1) == \"0\"", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val == \"0\"");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(1) != 0", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val != 0");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(1) == 0", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val == 0");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(true)", c => {
    var data = new SimpleValueSource({
        val: true
    });
    var tree = exprTree.create("val");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(false)", c => {
    var data = new SimpleValueSource({
        val: false
    });
    var tree = exprTree.create("val");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(1) != null", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val != null");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(1) == null", c => {
    var data = new SimpleValueSource({
        val: 1
    });
    var tree = exprTree.create("val == null");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(true) && val2(true)", c => {
    var data = new SimpleValueSource({
        val: true,
        val2: true
    });
    var tree = exprTree.create("val && val2");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(true) && val2(false)", c => {
    var data = new SimpleValueSource({
        val: true,
        val2: false
    });
    var tree = exprTree.create("val && val2");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(false) && val2(true)", c => {
    var data = new SimpleValueSource({
        val: false,
        val2: true
    });
    var tree = exprTree.create("val && val2");
    c.assert(!tree.isTrue(data), "Should be false.");
});

runner.runTest("val(true) || val2(true)", c => {
    var data = new SimpleValueSource({
        val: true,
        val2: true
    });
    var tree = exprTree.create("val || val2");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(true) || val2(false)", c => {
    var data = new SimpleValueSource({
        val: true,
        val2: false
    });
    var tree = exprTree.create("val || val2");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.runTest("val(false) || val2(true)", c => {
    var data = new SimpleValueSource({
        val: false,
        val2: true
    });
    var tree = exprTree.create("val || val2");
    c.assert(tree.isTrue(data), "Should be true.");
});

runner.endTestSection();