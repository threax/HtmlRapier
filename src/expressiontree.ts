///<amd-module name="hr.expressiontree"/>

export enum OperationType
{
    And,
    Or,
    Equal,
    NotEqual,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual
}

export interface ExpressionNode {
    left: ExpressionNode;
    right: ExpressionNode;
    test: {[key: string]: any};
    operation: OperationType;
}

export interface IValueSource {
    getValue(name: string): any;
}

export class ObjectValueSource implements IValueSource {
    constructor(private source: any) {

    }

    getValue(name: string): any{
        return this.source[name];
    }
}

export class ExpressionTree {
    constructor(private root: ExpressionNode){

    }

    public isTrue(test: IValueSource): boolean{
        return false;
    }
}