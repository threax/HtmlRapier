///<amd-module name="hr.test.RunTests"/>

import * as TestRunner from 'hr.test.TestRunner';
import * as controller from 'hr.controller';

function isError(e): e is Error {
    return e && e.stack && e.message;
}

export interface ITestDisplay {
    testName: string;
    message: string;
    success: boolean;
}

export class TestRunnerController implements TestRunner.ITestRunner {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    private context: TestRunner.TestContext = new TestRunner.TestContext();
    private failures: controller.IView<ITestDisplay>;

    constructor(bindings: controller.BindingCollection) {
        this.failures = bindings.getView<ITestDisplay>("failures");
    }

    beginTestSection(title: string): void {
        console.log("Starting test section " + title);
    }

    runTest(title: string, test: TestRunner.TestFunc): void {
        var result: ITestDisplay = {
            testName: title,
            success: true,
            message: null
        }
        console.log("Running: " + title);
        try {
            test(this.context);
            result.message = "Passed";
            result.success = true;
            console.log("Passed");
        }
        catch (err) {
            result.success = false;
            if (isError(err)) {
                result.message = err.message;
                console.log("Failed: " + err.message);
            }
            else {
                result.message = JSON.stringify(err);
            }
            //this.failures.appendData(result);
        }
    }
}

var builder = new controller.InjectedControllerBuilder();
builder.Services.addShared(TestRunnerController, TestRunnerController);
var built = builder.create("testResults", TestRunnerController)[0];
TestRunner.setTestRunner(built);