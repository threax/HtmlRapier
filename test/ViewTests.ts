///<amd-module name="hr.test.view"/>

import * as exprTree from 'hr.expressionTree';
import * as textstream from 'hr.textstream';
import { TestContext, setupTests } from 'hr.test.UnitTests';
import * as controller from 'hr.controller';
import { IViewDataFormatter, Extractor } from 'hr.view';

var runner = setupTests();
runner.beginTestSection("View");

runner.runTest("Not Found View", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection, TestContext];
        }

        constructor(bindings: controller.BindingCollection, testContext: TestContext) {
            var view = bindings.getView("doesNotExist");
            view.setData({
                message: "Hello"
            });
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(TestContext, s => c);
    builder.Services.addShared(ViewTestController, ViewTestController);
    var result = builder.create("notFoundView", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("Text View", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection, TestContext];
        }

        constructor(bindings: controller.BindingCollection, testContext: TestContext) {
            var view = bindings.getView("view");
            view.setData({
                message: "Hello"
            });
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(TestContext, s => c);
    builder.Services.addShared(ViewTestController, ViewTestController);
    var result = builder.create("textView", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("Component View Single", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection];
        }

        constructor(bindings: controller.BindingCollection) {
            var view = bindings.getView("view");
            view.setData({
                message: "Hello"
            });
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(ViewTestController, ViewTestController);
    var result = builder.create("componentViewSingle", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("Component View Multiple Append", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection];
        }

        constructor(bindings: controller.BindingCollection) {
            var view = bindings.getView("view");
            view.appendData({
                message: "Hello 1"
            });
            view.appendData({
                message: "Hello 2"
            });
            view.appendData({
                message: "Hello 3"
            });
            view.appendData({
                message: "Hello 4"
            });
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(ViewTestController, ViewTestController);
    var result = builder.create("componentViewMultipleAppend", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("Component View Multiple At Once", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection];
        }

        constructor(bindings: controller.BindingCollection) {
            var view = bindings.getView("view");
            var data = [{
                    message: "Hello 1"
                },
                {
                    message: "Hello 2"
                },
                {
                    message: "Hello 3"
                },
                {
                    message: "Hello 4"
                }];
            view.setData(data);
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(ViewTestController, ViewTestController);
    var result = builder.create("componentViewMultipleAtOnce", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("Component View Multiple Clear", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection];
        }

        constructor(bindings: controller.BindingCollection) {
            var view = bindings.getView("view");
            view.setData({
                message: "Hello"
            });
            view.appendData({
                message: "Hello"
            });
            view.clear();
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(ViewTestController, ViewTestController);
    var result = builder.create("componentViewMultipleClear", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("Component View Variant", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection, TestContext];
        }

        constructor(bindings: controller.BindingCollection, testContext: TestContext) {
            var view = bindings.getView("view");
            var data = {
                message: "Hello"
            };
            view.setData(data, undefined, d => {
                testContext.assert(data === d, "Data coming out of view for variant did not match incoming");
                return "variant";
            });
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(ViewTestController, ViewTestController);
    builder.Services.addShared(TestContext, s => c);
    var result = builder.create("componentViewVariant", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("Component View Callback", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection, TestContext];
        }

        constructor(bindings: controller.BindingCollection, testContext: TestContext) {
            var view = bindings.getView("view");
            var data = {
                message: "Hello"
            };

            view.setData(data, (created, item) => {
                testContext.assert(created !== null, "Created item was null");
                testContext.assert(item !== null, "Callback item was null");
                testContext.assert(item === data, "Callback item did not match passed in data");
            });
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(ViewTestController, ViewTestController);
    builder.Services.addShared(TestContext, s => c);
    var result = builder.create("componentViewCallback", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("View From Function", c => {
    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection];
        }

        constructor(bindings: controller.BindingCollection) {
            var data = (key: string) => "Hello";
            var view = bindings.getView("view");
            view.setData(data);
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(ViewTestController, ViewTestController);
    var result = builder.create("viewFromFunction", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.runTest("Formatted View", c => {
    class SimpleFormatter<T> implements IViewDataFormatter<T> {
        constructor(private status: TestStatus) {

        }

        convert(data: T): Extractor<T> {
            this.status.calledConvert = true;
            return new SimpleExtractor(data, this.status);
        }
    }

    class SimpleExtractor<T> implements Extractor<T>{
        constructor(public original: T, private status: TestStatus) {

        }

        getRawData(address: exprTree.IDataAddress) {
            this.status.calledGetRawData = true;
            return address.read(this.original);
        }
        getFormatted(data: any, address: exprTree.IDataAddress) {
            this.status.calledGetFormatted = true;
            return "Formatted: " + data;
        }
    }

    class TestStatus {
        calledGetFormatted = false;
        calledGetRawData = false;
        calledConvert = false;
    }

    class ViewTestController {
        public static get InjectorArgs(): controller.DiFunction<any>[] {
            return [controller.BindingCollection, TestContext];
        }

        constructor(bindings: controller.BindingCollection, testContext: TestContext) {
            var view = bindings.getView("view");
            var data = {
                message: "Hello"
            };
            var status = new TestStatus();
            view.setFormatter(new SimpleFormatter<any>(status));
            view.setData(data);
            testContext.assert(status.calledConvert, "Did not call IViewDataFormatter.convert");
            testContext.assert(status.calledGetRawData, "Did not call Extractor.calledGetRawData");
            testContext.assert(status.calledGetFormatted, "Did not call Extractor.calledGetFormatted");
        }
    }

    var builder = new controller.InjectedControllerBuilder();
    builder.Services.addShared(TestContext, s => c);
    builder.Services.addShared(ViewTestController, ViewTestController);
    var result = builder.create("formattedView", ViewTestController);
    c.assert(result.length > 0, "No Controller Created");
});

runner.endTestSection();