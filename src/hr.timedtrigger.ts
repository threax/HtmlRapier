"use strict";

import {EventHandler} from './hr.eventhandler';

export function TimedTrigger(delay) {
    if (delay === undefined) {
        delay = 400;
    }

    var _delay = delay;
    var holder;
    var handler = new EventHandler();
    var args;

    this.handler = handler.modifier;

    function setDelay(delay) {
        _delay = delay;
    }
    this.setDelay = setDelay;

    function cancel() {
        clearTimeout(holder);
        args = undefined;
    }
    this.cancel = cancel;

    function fire() {
        cancel();
        holder = window.setTimeout(fireHandler, _delay);
        args = arguments;
    }
    this.fire = fire;

    function addListener(context, listener) {
        handler.modifier.add(context, listener);
    }
    this.addListener = addListener;

    function removeListener(context, listener) {
        handler.modifier.remove(context, listener);
    }
    this.removeListener = removeListener;

    function fireHandler() {
        handler.fire.apply(handler, args);
    }

}