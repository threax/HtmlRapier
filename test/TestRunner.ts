///<amd-module name="hr.test.TestRunner"/>

import * as exprTree from 'hr.expressionTree';
import * as textstream from 'hr.textstream';

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