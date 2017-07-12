import * as http from 'hr.http';
import * as uri from 'hr.uri';
import { Fetcher, RequestInfo, RequestInit, Response, Request } from 'hr.fetcher';
import * as events from 'hr.eventdispatcher';

//From https://github.com/auth0/jwt-decode/blob/master/lib/base64_url_decode.js
function b64DecodeUnicode(str: string) {
    return decodeURIComponent(atob(str).replace(/(.)/g, function (m, p) {
        var code = p.charCodeAt(0).toString(16).toUpperCase();
        if (code.length < 2) {
            code = '0' + code;
        }
        return '%' + code;
    }));
}

function base64_url_decode(str: string) {
    var output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += "==";
            break;
        case 3:
            output += "=";
            break;
        default:
            throw "Illegal base64url string!";
    }

    try {
        return b64DecodeUnicode(output);
    } catch (err) {
        return atob(output);
    }
};

//From https://github.com/auth0/jwt-decode/blob/master/lib/index.js
function parseJwt(token: string, options?: any) {
    if (typeof token !== 'string') {
        throw new Error('Invalid token specified');
    }

    options = options || {};
    var pos = options.header === true ? 0 : 1;
    return JSON.parse(base64_url_decode(token.split('.')[pos]));
};

export interface IAccessWhitelist {
    canSendAccessToken(url: RequestInfo): boolean;
}

function requestIsRequestObject(test: RequestInfo): test is Request {
    return (<Request>test).url !== undefined;
}

export class AccessWhitelist implements IAccessWhitelist {
    private whitelist: uri.Uri[] = [];

    constructor(whitelist?: string[]) {
        if (whitelist) {
            for (var i = 0; i < whitelist.length; ++i) {
                this.add(whitelist[i]);
            }
        }
    }

    public add(url: string) {
        this.whitelist.push(new uri.Uri(this.transformInput(url)));
    }

    public canSendAccessToken(url: RequestInfo): boolean {
        var testUri: uri.Uri;
        if (requestIsRequestObject(url)) {
            testUri = new uri.Uri(this.transformInput(url.url));
        }
        else {
            testUri = new uri.Uri(this.transformInput(url));
        }

        for (var i = 0; i < this.whitelist.length; ++i) {
            var item = this.whitelist[i];
            //Check to see if the urls match here, check that authorities match and
            //that the path for the item starts with the whitelisted path.
            if (item.protocol === 'HTTPS'
                && item.authority == testUri.authority
                && (<any>testUri.path).startsWith(item.path)) {
                return true;
            }
        }

        return false;
    }

    private transformInput(url: string): string {
        return url.toLocaleUpperCase();
    }
}

export class AccessTokenManager extends Fetcher {
    public static isInstance(t: any): t is AccessTokenManager {
        return (<AccessTokenManager>t).onNeedLogin !== undefined
            && (<AccessTokenManager>t).fetch !== undefined;
    }

    private tokenPath: string;
    private accessToken: string;
    private next: Fetcher;
    //Remove this
    private tokenPromise: Promise<string>; //The promise that gets the token
    private currentToken: any;
    private startTime: number;
    private expirationTick: number;
    private accessWhitelist: IAccessWhitelist;
    private needLoginEvent: events.PromiseEventDispatcher<boolean, AccessTokenManager> = new events.PromiseEventDispatcher<boolean, AccessTokenManager>();

    constructor(tokenPath: string, accessWhitelist: IAccessWhitelist, next: Fetcher) {
        super();
        this.tokenPath = tokenPath;
        this.next = next;
        this.accessWhitelist = accessWhitelist;
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        //Make sure the request is allowed to send an access token
        if (this.accessWhitelist.canSendAccessToken(url)) {
            //Does token need refresh?
            if (this.startTime === undefined || Date.now() / 1000 - this.startTime > this.expirationTick) {
                return http.post(this.tokenPath)
                    .then((data: any) => {
                        this.currentToken = data.accessToken;

                        var tokenObj = parseJwt(this.currentToken);
                        this.startTime = tokenObj.nbf;
                        this.expirationTick = (tokenObj.exp - this.startTime) / 2; //After half the token time has expired we will turn it in for another one.

                        return this.addToken(url, init);
                    })
                    .catch(err => { //This error happens only if we can't get the access token, if we previously had logged in then try to refresh, otherwise just do the request
                        if (this.currentToken !== undefined) {
                            return this.fireNeedLogin()
                                .then(needsLogin => {
                                    if (needsLogin) {
                                        //url and init will not have been changed yet, fire fetch again.
                                        return this.fetch(url, init); 
                                    }
                                    else {
                                        //Got no result, return an error
                                        this.startTime = undefined;
                                        throw "Could not get access token or log back in.";
                                    }
                                });
                        }
                        else {
                            return this.addToken(url, init);
                        }
                    });
            }
            else {
                return this.addToken(url, init);
            }
        }
        else {
            return this.next.fetch(url, init);
        }
    }

    public reset(): void {
        this.startTime = undefined; //Set this back to undefined to make the fetcher get the access token again.
        if (this.next) {
            this.next.reset();
        }
    }

    /**
     * Get an event listener for the given status code. Since this fires as part of the
     * fetch request the events can return promises to delay sending the event again
     * until the promise resolves.
     * @param status The status code for the event.
     */
    public get onNeedLogin(): events.EventModifier<events.FuncEventListener<Promise<boolean>, AccessTokenManager>> {
        return this.needLoginEvent.modifier;
    }

    private addToken(url: RequestInfo, init?: RequestInit) {
        (<any>init.headers).bearer = this.currentToken;
        return this.next.fetch(url, init);
    }

    private async fireNeedLogin(): Promise<boolean> {
        var retryResults = await this.needLoginEvent.fire(this);

        if (retryResults) {
            //Take first result that is actually defined, if none are the original result will be used again
            for (var i = 0; i < retryResults.length; ++i) {
                if (retryResults[i]) {
                    return retryResults[i];
                }
            }
        }

        return false;
    }
}