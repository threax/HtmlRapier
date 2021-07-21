"use strict";

import * as typeId from 'hr.typeidentifiers';

export interface IteratorInterface<T> {
    next(): IterateResult<T>;
}

export interface IterableInterface<T> {
    select<NewType>(s: (i: T) => NewType): IterableInterface<NewType>;

    where(w: (i: T) => boolean): IterableInterface<T>;

    forEach(cb: (i: T) => void);

    iterator(): IteratorInterface<T>;
}

class Query {
    private chain = [];

    constructor() {

    }

    /**
     * Push an item, queries are derived backward (lifo).
     */
    push(c) {
        this.chain.push(c);
    }

    /**
     * Derive the query lifo order from how they were pushed.
     */
    derive(item) {
        var result = item;
        for (var i = this.chain.length - 1; i >= 0 && result !== undefined; --i) {
            result = this.chain[i](result);
        }
        return result;
    }
}

var defaultQuery = new Query(); //Empty query to use as default

class IterateResult<T> {
    constructor(done: boolean, value?: T) {
        this.done = done;
        this.value = value;
    }

    done: boolean;
    value: T;
}

function _iterate<T>(items, query) {
    var i;
    if (typeId.isArray(items)) {
        i = 0;
        return {
            next: function (): IterateResult<T> {
                var result = undefined;
                while (result === undefined && i < items.length) {
                    var item = items[i++];
                    result = query.derive(item);
                }
                if (result === undefined) {
                    return new IterateResult<T>(true);
                }
                else {
                    return new IterateResult<T>(false, result);
                }
            }
        };
    }
    else if (typeId.isFunction(items)) {
        return {
            next: function (): IterateResult<T> {
                var result = undefined;
                while (result === undefined) {
                    var item = items();
                    if (item !== undefined) { //Terminate iterator if fake generator returns undefined
                        result = query.derive(item);
                    }
                    else {
                        break;
                    }
                }
                if (result === undefined) {
                    return new IterateResult<T>(true);
                }
                else {
                    return new IterateResult<T>(false, result);
                }
            }
        };
    }
}

function _forEach(items, query, cb) {
    var i;
    if (typeId.isArray(items)) {
        for (i = 0; i < items.length; ++i) {
            let item = items[i];
            var transformed = query.derive(item);
            if (transformed !== undefined) {
                cb(transformed);
            }
        }
    }
    else if (typeId.isFunction(items)) {
        let item = items();
        while (item !== undefined) {
            item = query.derive(item);
            cb(item);
            item = items();
        }
    }
    else if (typeId.isForEachable(items)) {
        items.forEach(item => {
            item = query.derive(item);
            if (item !== undefined) {
                cb(item);
            }
        });
    }
    else if (typeId.isGenerator(items)) {
        let item = items.next();
        while (!item.done) {
            item = query.derive(item);
            cb(item.value);
            item = items.next();
        }
    }
}

abstract class IteratorBase<T> implements IterableInterface<T>{
    select<NewType>(s: (i: T) => NewType): IterableInterface<NewType> {
        return new Selector<NewType>(s, this);
    }

    where(w: (i: T) => boolean): IterableInterface<T> {
        return new Conditional(w, this);
    }

    forEach(cb: (i: T) => void) {
        this.build(new Query()).forEach(cb);
    }

    iterator(): IteratorInterface<T> {
        return this.build(new Query()).iterator();
    }

    abstract build(query: Query);
}

class Selector<T> extends IteratorBase<T>{
    constructor(private selectCb, private previous: IteratorBase<any>) {
        super();
    }

    build(query: Query) {
        query.push(i => this.selectCb(i));
        return this.previous.build(query);
    }
}

class Conditional<T> extends IteratorBase<T> {

    constructor(private whereCb, private previous: IteratorBase<T>) {
        super();
    }

    public build(query: Query) {
        query.push((i) => this.getItem(i));
        return this.previous.build(query);
    }

    private getItem(item) {
        if (this.whereCb(item)) {
            return item;
        }
    }
}

export type IteratorSource<T> = () => T;

export class Iterable<T> extends IteratorBase<T> {
    constructor(private items: T[] | IteratorSource<T> | IteratorBase<T> | Generator<T>) {
        super();
    }

    public build(query) {
        return new BuiltQuery<T>(this.items, query);
    }
}

class BuiltQuery<T>{
    constructor(private items, private query) {

    }

    forEach(cb) {
        _forEach(this.items, this.query, cb);
    }

    iterator() {
        return _iterate(this.items, this.query);
    }
}