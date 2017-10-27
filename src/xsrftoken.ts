///<amd-module name="hr.xsrftoken"/>

import { Fetcher, RequestInfo, RequestInit, Response, fetch } from 'hr.fetcher';

/**
 * A fetcher implementation that calls the global window fetch function.
 * Use this to terminate fetcher chains and do the real fetch work.
 * @returns
 */
export class XsrfTokenFetcher extends Fetcher {
    constructor(private token: string, private next: Fetcher) {
        super();
    }

    public async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        return this.next.fetch(url, init);
    }
}