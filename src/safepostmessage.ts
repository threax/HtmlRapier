import * as uri from 'hr.uri';

export class PostMessageValidator {
    constructor(private validOrigin: string, private checkSource: boolean = true) {
        this.validOrigin = createOrigin(validOrigin);
    }

    public isValid(e: MessageEvent): boolean {
        //Check origin
        if (e.origin !== this.validOrigin) {
            return false;
        }

        //Check if we can read from the source frame, if enabled
        if(this.checkSource) {
            try {
                //Try to read location from target window, which is used as a secondary validation of source per Mozilla
                //https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
                let checkSource = (<any>e.source).location.href;
            }
            catch (err) {
                //Can't read source window, bail
                return false;
            }
        }

        return true;
    }
}

export class MessagePoster {
    constructor(private targetOrigin: string) {
        this.targetOrigin = createOrigin(targetOrigin);
    }

    public postWindowMessage(target: Window, message: any, transfer?: Transferable[]): void {
        target.postMessage(message, this.targetOrigin, transfer);
    }
}

/**
 * Get the origin from any url that can be used to validate messages.
 * @param url The url to change into an origin.
 */
function createOrigin(url: string): string {
    var parsed = uri.parseUri(url);
    return `${parsed.protocol}://${parsed.authority}`;
}