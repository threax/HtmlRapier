///<amd-module name="hr.credentialsfetcher"/>

import { Fetcher, RequestInfo, RequestInit, Response } from 'hr.Fetcher';
import { AccessWhitelist } from 'hr.accesstokens';

/**
 * A fetcher that adds credentials to whitelisted urls.
 * @param {type} next - The next fetcher in the chain.
 * @returns
 */
export class WithCredentialsFetcher implements Fetcher {
    private next: Fetcher;
    private accessWhitelist: AccessWhitelist;

    constructor(accessWhitelist: AccessWhitelist, next: Fetcher) {
        this.next = next;
        this.accessWhitelist = accessWhitelist;
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        if(this.accessWhitelist.canSendAccessToken(url)) {
            if(init === undefined){
                init = {};
            }
            init.credentials = "include";
        }
        return this.next.fetch(url, init);
    }
}