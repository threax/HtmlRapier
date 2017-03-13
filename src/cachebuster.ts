import { Fetcher, RequestInfo, RequestInit, Response, Request } from 'hr.fetcher';

function isRequest(url: RequestInfo): url is Request {
    return url !== undefined && url !== null && (<Request>url).url !== undefined;
}

/**
 * A fetcher that removes caching.
 * @param {type} next - The next fetcher in the chain.
 * @returns
 */
export class CacheBuster extends Fetcher {
    private next: Fetcher;

    constructor(next: Fetcher) {
        super();
        this.next = next;
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        if (init !== undefined && init.method == 'GET') {
            if (isRequest(url)) {
                url.url = addTimestampQuery(url.url);
            }
            else {
                url = addTimestampQuery(url);
            }
            init.cache = "no-cache";
        }
        return this.next.fetch(url, init);
    }
}

function addTimestampQuery(url: string): string {
    var regex = /([?&]noCache=)\d*/g;
    if (regex.test(url)) {
        url = url.replace(regex, '$1' + new Date().getTime());
    }
    else {
        if (url.indexOf('?') > -1) {
            url += '&';
        }
        else {
            url += '?';
        }
        url += 'noCache=' + new Date().getTime();
    }

    return url;
}