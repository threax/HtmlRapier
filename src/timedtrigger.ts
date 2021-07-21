"use strict";

import {ActionEventDispatcher, ActionEventListener} from './eventdispatcher';

export class TimedTrigger<TArg> {

    private delay: number;
    private holder;
    private handler = new ActionEventDispatcher<TArg>();
    private args: TArg;

    constructor(delay?:number){
        if (delay === undefined) {
            delay = 400;
        }

        this.delay = delay;
    }

    public setDelay(delay) {
        this.delay = delay;
    }

    public cancel() {
        clearTimeout(this.holder);
        this.args = undefined;
    }

    public fire(args: TArg) {
        this.cancel();
        this.holder = window.setTimeout(() => this.fireHandler(), this.delay);
        this.args = args;
    }

    public addListener(listener: ActionEventListener<TArg>) {
        this.handler.add(listener);
    }

    public removeListener(listener: ActionEventListener<TArg>) {
        this.handler.remove(listener);
    }

    public fireHandler() {
        this.handler.fire(this.args);
    }
}