import { Fetcher, RequestInfo, RequestInit, Response, Request } from 'hr.fetcher';
import * as events from 'hr.eventdispatcher';

function isRequest(url: RequestInfo): url is Request {
    return url !== undefined && url !== null && (<Request>url).url !== undefined;
}

/**
 * This interface wraps a fetch request that can be retried.
 */
export interface IRetryFetcher{

    /**
     * Try the fetch request again.
     */
    retryFetch(): Promise<Response>;
}

/**
 * Concrete retry fetcher.
 */
class RetryFetcher implements IRetryFetcher{
    constructor(private url: RequestInfo, private init: RequestInit, private eventFetcher: EventFetcher, private next: Fetcher){

    }

    public async retryFetch(): Promise<Response>{
        var realUrl: RequestInfo;
        if(isRequest(this.url)){
            realUrl = Object.create(this.url);
        }
        else{
            realUrl = this.url;
        }

        var result = await this.next.fetch(realUrl, Object.create(this.init));

        return await this.eventFetcher.handleResult(result, this);
    }
}

/**
 * A fetcher that fires events when status codes are returned from the server.
 * You can subscribe to any status code you want by calling onStatusCode.
 * @param {type} next - The next fetcher in the chain.
 * @returns
 */
export class EventFetcher extends Fetcher{
    private next: Fetcher;
    private statusEvents: {[key: number]: events.PromiseEventDispatcher<Response, IRetryFetcher>} = {};

    constructor(next: Fetcher) {
        super();
        this.next = next;
    }

    /**
     * Get an event listener for the given status code. Since this fires as part of the
     * fetch request the events can return promises to delay sending the event again
     * until the promise resolves.
     * @param status The status code for the event.
     */
    public onStatusCode(status: number): events.EventModifier<events.FuncEventListener<Promise<Response>, IRetryFetcher>>{
        if(this.statusEvents[status] === undefined){
            this.statusEvents[status] = new events.PromiseEventDispatcher<Response, IRetryFetcher>();
        }

        return this.statusEvents[status].modifier;
    }

    public fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        var retry = new RetryFetcher(url, init, this, this.next);
        return retry.retryFetch();
    }

    public async handleResult(result: Response, retry: RetryFetcher): Promise<Response>{
        if(this.statusEvents[result.status] !== undefined){
            var retryResults = await this.statusEvents[result.status].fire(retry);

            //Take first result that is actually defined, if none are the original result will be used again
            for(var i = 0; i < retryResults.length; ++i){
                if(retryResults[i]){
                    result = retryResults[i];
                    break;
                }
            }
        }
        return result;
    }
}