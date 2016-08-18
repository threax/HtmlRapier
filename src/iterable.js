"use strict";

jsns.define("hr.iterable", [
    "hr.typeidentifiers"
],
function (exports, module, typeId) {

    function Selector(selectCb) {
        function get(item) {
            return selectCb(item);
        }
        this.get = get;
    }

    function Conditional(whereCb) {
        function get(item) {
            if (whereCb(item)) {
                return item;
            }
        }
        this.get = get;
    }

    function Query() {
        var chain = [];

        function push(c) {
            chain.push(c);
        }
        this.push = push;

        function derive(item) {
            var result = item;
            for (var i = 0; i < chain.length; ++i) {
                result = chain[i].get(result);
            }
            return result;
        }
        this.derive = derive;
    }

    var defaultQuery = new Query(); //Empty query to use as default

    function iterate(items, query) {
        var i;
        if (typeId.isArray(items)) {
            i = 0;
            return {
                next: function(){
                    var result = undefined;
                    while(result === undefined && i < items.length){
                        var item = items[i++];
                        result = query.derive(item);
                    }
                    if(result === undefined){
                        return { done: true };
                    }
                    else{
                        return {done: false, value: item};
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
    }

    function Iterable(items) {
        var query = defaultQuery;

        function ensureQuery() {
            if (query === defaultQuery) {
                query = new Query();
            }
        }

        function where(w) {
            ensureQuery();
            query.push(new Conditional(w));
            return this;
        }
        this.where = where;

        function select(s) {
            ensureQuery();
            query.push(new Selector(s));
            return this;
        }
        this.select = select;

        function iterator() {
            return iterate(items, query);
        }
        this.iterator = iterator;

        function forEach(cb) {
            _forEach(items, query, cb);
        }
        this.forEach = forEach;
    }

    module.exports = Iterable;
});