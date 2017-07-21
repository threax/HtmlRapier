///<amd-module name="hr.externalpromise"/>

"use strict";

/**
 * This is a wrapper for a promise that exposes the resolve
 * and reject functions.
 */
export class ExternalPromise<T> {
    private resolveCb;
    private rejectCb;
    private _promise : Promise<T>;

    constructor(){
        this._promise = new Promise<T>((resolve, reject) => {
            this.resolveCb = resolve;
            this.rejectCb = reject;
        });
    }

    resolve(data?:T){
        this.resolveCb(data);
    }

    reject(error){
        this.rejectCb(error);
    }

    get Promise(){
        return this._promise;
    }
};