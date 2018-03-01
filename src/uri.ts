///<amd-module name="hr.uri"/>

"use strict";

import { escape } from 'hr.escape';

// based on parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
// http://blog.stevenlevithan.com/archives/parseuri

var parseUriOptions = {
    strictMode: false,
    key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
    q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};

export class Uri {
    source: string;
    protocol: string;
    authority: string;
    userInfo: string;
    user: string;
    password: string;
    host: string;
    port: string;
    relative: string;
    path: string;
    directory: string;
    file: string;
    query: string;
    anchor: string;

    private splitPath: string[];

    /**
     * Constructor. Optionally takes the url to parse, otherwise uses current
     * page url.
     * @param {string} url? The url to parse, if this is not passed it will use the window's url, if null is passed no parsing will take place.
     */
    constructor(url?: string) {
        if (url === undefined && window !== undefined) {
            url = window.location.href;
        }

        if (url !== null) {
            var o = parseUriOptions;
            var m = o.parser[o.strictMode ? "strict" : "loose"].exec(url);
            var uri = this;
            var i = 14;

            while (i--) uri[o.key[i]] = m[i] || "";

            uri[o.q.name] = {};
            uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
                if ($1) uri[o.q.name][$1] = $2;
            });

            this.path = this.path.replace('\\', '/'); //Normalize slashes
        }
    }

    /**
     * Get the section of the path specified by the index i.
     * @param {number} i The index of the section of the path to get use negative numbers to start at the end.
     * @returns
     */
    getPathPart(i: number): string {
        if (this.splitPath === undefined) {
            this.splitPath = this.path.split('/');
        }

        //Negative index, start from back
        var part = null;
        if (i < 0) {
            if (-i < this.splitPath.length) {
                part = this.splitPath[this.splitPath.length + i];
            }
        }
        else if (i < this.splitPath.length) {
            part = this.splitPath[i];
        }

        if (part !== null) {
            part = escape(part);
        }

        return part;
    }

    /**
     * Set the query portion of the url to the given object's keys and values.
     * The keys will not be altered, the values will be uri encoded. If a value
     * in the object is null or undefined it will not be included in the query string.
     * If data is null or undefined, the query will be cleared.
     * @param {type} data The object to make into a query.
     */
    setQueryFromObject(data: any): void {
        var queryString = "";
        if(data === undefined || data === null){ //set to empty object if undefined or null to clear the string
            data = {};
        }
        for (var key in data) {
            if (data[key] !== undefined && data[key] !== null) {
                if(Array.isArray(data[key])){
                    var arr: any[] = data[key];
                    for(var i = 0; i < arr.length; ++i){
                        queryString += key + '=' + encodeURIComponent(arr[i]) + '&';
                    }
                }
                else if (data[key] instanceof Date) {
                    var parsedDate = data[key].toISOString();
                    queryString += queryString += key + '=' + encodeURIComponent(parsedDate) + '&';
                }
                else{
                    queryString += key + '=' + encodeURIComponent(data[key]) + '&';
                }
            }
        }
        if (queryString.length > 0) {
            queryString = queryString.substr(0, queryString.length - 1);
        }
        this.query = queryString;
    }

    /**
     * Create an object from the uri's query string. The values will
     * all be run through decodeURIComponent. 
     * All query string names will be set to lower case
     * to make looking them back up possible no matter the url case.
     * @returns An object version of the query string.
     */
    getQueryObject() {
        var cleanQuery = this.query;
        if (cleanQuery.charAt(0) === '?') {
            cleanQuery = cleanQuery.substr(1);
        }
        var qs = cleanQuery.split('&');
        var val = {};
        for (var i = 0; i < qs.length; ++i) {
            var pair = qs[i].split('=', 2);
            if(pair.length > 0){
                var name = pair[0].toLowerCase();
                var pairValue = "";
                if (pair.length > 1) {
                    pairValue = decodeURIComponent(pair[1].replace(/\+/g, ' '));
                }
                if(val[name] === undefined){
                    //Undefined, set value directly
                    val[name] = pairValue;
                }
                else if(Array.isArray(val[name])){
                    //Already an array, add the value
                    val[name].push(pairValue);
                }
                else{
                    //One value set, add 2nd into array
                    val[name] = [val[name], pairValue];
                }
            }
        }
        return val;
    }

    /**
     * Build the complete url from the current settings.
     * This will do the following concatentaion:
     * protocol + '://' + authority + directory + file + '?' + query
     * @returns
     */
    build(): string {
        var query = this.query;
        if (query && query.charAt(0) !== '?') {
            query = '?' + query;
        }
        return this.protocol + '://' + this.authority + this.directory + this.file + query;
    }
}

/**
 * Get an object with the values from the query string. These values
 * will be sent through the escape function to help prevent xss before
 * you get the values back. All query string names will be set to lower case
 * to make looking them back up possible no matter the url case.
 * @returns {type} The window's query as an object.
 */
export function getQueryObject() {
    var url = new Uri(null);
    url.query = window.location.search;
    return url.getQueryObject();
}

/**
 * Parse a uri and return a new uri object.
 * @param {type} str The url to parse
 * @deprecated Use the Uri class directly.
 * @returns
 */
export function parseUri(str: string) : Uri {
    return new Uri(str);
};