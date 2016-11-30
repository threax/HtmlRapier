"use strict";

import * as typeId from 'hr.typeidentifiers';

export interface IteratorInterface<T>{
    next(): IterateResult<T>;
}

export interface IterableInterface<T>{
    select<NewType>(s): IterableInterface<NewType>;

    where(w):IterableInterface<T>;

    forEach(cb:(i:T)=>void);

    iterator():IteratorInterface<T>;
}

function Query() {
    var chain = [];

    function push(c) {
        chain.push(c);
    }
    this.push = push;

    function derive(item) {
        var result = item;
        for (var i = chain.length - 1; i >= 0 && result !== undefined; --i) {
            result = chain[i](result);
        }
        return result;
    }
    this.derive = derive;
}

var defaultQuery = new Query(); //Empty query to use as default

class IterateResult<T> {
    constructor(done: boolean, value?: any) {
        this.done = done;
        this.value = value;
    }

    done: boolean;
    value: any;
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
            var item = items[i];
            var transformed = query.derive(item);
            if (transformed !== undefined) {
                cb(transformed);
            }
        }
    }
    else if (typeId.isFunction(items)) {
        var item = items();
        while (item !== undefined) {
            item = query.derive(item);
            cb(item);
            item = items();
        }
    }
}

function _build(prevBuild, get, query, cb) {
    query.push(get);
    return prevBuild(query, cb);
}

function _queryClause(build) {
    this.select = function (s) {
        return new Selector(s, build);
    }

    this.where = function (w) {
        return new Conditional(w, build);
    }

    this.forEach = function (cb) {
        build(new Query()).forEach(cb);
    }

    this.iterator = function () {
        return build(new Query()).iterator();
    }
}

function Selector(selectCb, prevBuild) {
    _queryClause.call(this, build);

    function build(query, cb) {
        return _build(prevBuild, selectCb, query, cb);
    }
}

function Conditional(whereCb, prevBuild) {
    _queryClause.call(this, build);

    function build(query, cb) {
        return _build(prevBuild, get, query, cb);
    }

    function get(item) {
        if (whereCb(item)) {
            return item;
        }
    }
}

export function Iterable(items) {
    _queryClause.call(this, build);

    function build(query) {
        return {
            forEach: function (cb) {
                _forEach(items, query, cb);
            },
            iterator: function () {
                return _iterate(items, query);
            }
        }
    }
}