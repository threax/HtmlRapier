///<amd-module name="hr.windowfetch"/>

import { Fetcher, RequestInfo, RequestInit, Response, fetch } from 'hr.fetcher';

export interface WindowFetchOptions {
    includeCredentials?: boolean;
}

/**
 * A fetcher implementation that calls the global window fetch function.
 * Use this to terminate fetcher chains and do the real fetch work.
 * @returns
 */
export class WindowFetch extends Fetcher {
    private options: WindowFetchOptions;

    constructor(options?: WindowFetchOptions) {
        super();
        if (options === undefined) {
            options = {};
        }
        this.options = options;
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        if (init === undefined) {
            init = {};
        }
        if (this.options.includeCredentials) {
            init.credentials = "include";
        }
        return fetch(url, init);
    }
}