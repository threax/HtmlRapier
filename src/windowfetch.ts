///<amd-module name="hr.windowfetch"/>

import { Fetcher } from 'hr.fetcher';

/**
 * A fetcher implementation that calls the global window fetch function.
 * Use this to terminate fetcher chains and do the real fetch work.
 * @returns
 */
export class WindowFetch extends Fetcher {
    constructor() {
        super();
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        return fetch(url, init);
    }
}