///<amd-module name="hr.test.UnitTests"/>
import * as hr from 'hr.main';
import * as controller from 'hr.controller';

hr.setup();

export type TestFunc = (ctx: TestContext) => void;

export interface ITestRunner {
    beginTestSection(title: string): void;
    runTest(title: string, test: TestFunc): void;
    endTestSection(): void;
}

export class TestContext {
    assert(result: boolean, errorString: string): void {
        if (!result) {
            throw new Error(errorString);
        }
    }
}

function isError(e): e is Error {
    return e && e.stack && e.message;
}

export interface ITestResults {
    passed: number;
    failed: number;
    total: number;
}

class TestResults implements ITestResults {
    passed: number = 0;
    failed: number = 0;
    total: number = 0;
}

export interface ITestDisplay {
    testName: string;
    message: string;
    success: boolean;
}

type ResultsDisplay = ITestResults | ITestDisplay | string;

export class TestRunnerController implements ITestRunner {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    private context: TestContext = new TestContext();
    private results: controller.IView<ResultsDisplay>;
    private totals: controller.IView<ITestResults>;
    private currentResults: TestResults = null;
    private allResults: TestResults = new TestResults();

    constructor(bindings: controller.BindingCollection) {
        this.results = bindings.getView<ResultsDisplay>("results");
        this.totals = bindings.getView<ITestResults>("totals");
    }

    beginTestSection(title: string): void {
        this.writeBreakdown();
        console.log("Starting test section " + title);
        this.results.appendData(title, undefined, d => "title");
        this.currentResults = new TestResults();
    }

    runTest(title: string, test: TestFunc): void {
        ++this.currentResults.total;
        ++this.allResults.total;

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
            ++this.currentResults.passed;
            ++this.allResults.passed;
            console.log("Passed");
        }
        catch (err) {
            result.success = false;
            ++this.currentResults.failed;
            ++this.allResults.failed;
            if (isError(err)) {
                result.message = err.message;
            }
            else {
                result.message = JSON.stringify(err);
            }
            console.log("Failed: " + result.message);
            try {
                this.results.appendData(result);
            }
            catch (err) {
                if (isError(err)) {
                    result.message = err.message;
                }
                else {
                    result.message = JSON.stringify(err);
                }
                console.log("Failed writing result: " + result.message);
            }
        }
    }

    endTestSection(): void {
        this.writeBreakdown();
        this.currentResults = null;
        this.totals.setData(this.allResults);
    }

    private writeBreakdown() {
        if (this.currentResults !== null) {
            console.log("Passed: " + this.currentResults.passed);
            console.log("Failed: " + this.currentResults.failed);
            console.log("Total: " + this.currentResults.total);
            this.results.appendData(this.currentResults, undefined, d => "breakdown");
        }
    }
}

var runner: ITestRunner = null;

export function setupTests(): ITestRunner {
    if (runner === null) {
        var builder = new controller.InjectedControllerBuilder();
        builder.Services.addShared(TestRunnerController, TestRunnerController);
        runner = builder.create("testResults", TestRunnerController)[0];
    }
    return runner;
}

//built.beginTestSection("Unit Tests for Tests");

//built.runTest("Pass", (ctx) => {
//    ctx.assert(true, "This test should pass.");
//});

//built.runTest("Fail", (ctx) => {
//    ctx.assert(false, "This test should fail.");
//});

//built.endTestSection();