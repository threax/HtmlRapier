///<amd-module name="hr.xsrftoken"/>

import { Fetcher, RequestInfo, RequestInit, Response, fetch } from 'hr.fetcher';
import { IWhitelist } from 'hr.whitelist';

export interface XsrfOptions{
    /**
     * The name of the header, will default to RequestVerificationToken
     */
    headerName: string;
}

/**
 * A fetcher implementation that calls the global window fetch function.
 * Use this to terminate fetcher chains and do the real fetch work.
 * @returns
 */
export class XsrfTokenFetcher extends Fetcher {
    constructor(private token: string, private accessWhitelist: IWhitelist, private next: Fetcher, private options?: XsrfOptions) {
        super();
        if(this.options === undefined){
            this.options = {
                headerName: "RequestVerificationToken",
            };
        }
    }

    public async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        if (this.accessWhitelist.isWhitelisted(url)) {
            init.headers[this.options.headerName] = this.token;
        }
        return this.next.fetch(url, init);
    }
}