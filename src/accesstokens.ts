import * as http from 'hr.http';
import * as docCookies from 'hr.cookies';
import * as uri from 'hr.uri';
import { Fetcher } from 'clientlibs.Fetcher';

//From https://github.com/auth0/jwt-decode/blob/master/lib/base64_url_decode.js
function b64DecodeUnicode(str) {
    return decodeURIComponent(atob(str).replace(/(.)/g, function (m, p) {
        var code = p.charCodeAt(0).toString(16).toUpperCase();
        if (code.length < 2) {
            code = '0' + code;
        }
        return '%' + code;
    }));
}

function base64_url_decode(str) {
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
function parseJwt(token:string, options?:any) {
    if (typeof token !== 'string') {
        throw new Error('Invalid token specified');
    }

    options = options || {};
    var pos = options.header === true ? 0 : 1;
    return JSON.parse(base64_url_decode(token.split('.')[pos]));
};

export class AccessTokenManager implements Fetcher {
    private tokenPath: string;
    private accessToken: string;
    private next: Fetcher;
    //Remove this
    private tokenPromise: Promise<string>; //The promise that gets the token
    private currentToken;
    private startTime;
    private expirationTick;

    constructor(tokenPath: string, next: Fetcher) {
        this.tokenPath = tokenPath;
        this.next = next;
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        //Make sure the request is trying to add a bearer token that is null, otherwise do nothing
        if (init !== undefined && init.headers !== undefined && (<any>init.headers).bearer === null) { 
            //Does token need refresh?
            if (this.startTime === undefined || Date.now() / 1000 - this.startTime > this.expirationTick){
                return http.post(this.tokenPath)
                    .then((data: any) => {
                        this.currentToken = data.accessToken;

                        var tokenObj = parseJwt(this.currentToken);
                        this.startTime = tokenObj.nbf;
                        this.expirationTick = (tokenObj.exp - this.startTime) / 2; //After half the token time has expired we will turn it in for another one.

                        return this.addToken(url, init);
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

    private addToken(url: RequestInfo, init?: RequestInit) {
        (<any>init.headers).bearer = this.currentToken;
        return this.next.fetch(url, init);
    }
}