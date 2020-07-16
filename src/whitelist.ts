import * as uri from 'hr.uri';

export interface IWhitelist {
    isWhitelisted(url: RequestInfo): boolean;
}

function requestIsRequestObject(test: RequestInfo): test is Request {
    return (<Request>test).url !== undefined;
}

export class Whitelist implements IWhitelist {
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

    public isWhitelisted(url: RequestInfo): boolean {
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
            if ((item.protocol === 'HTTPS' || item.protocol === '') //Accept https or empty protocol only 
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