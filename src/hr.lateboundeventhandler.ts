import {EventHandler as HrEventHandler} from './hr.eventhandler';

/**
 * This class will queue up the events that fire through it until
 * an event handler is added, at that point it will function as a normal
 * event handler. Only the first bound event gets the queued events.
 */
export function LateBoundEventHandler() {
    var eventHandler = new HrEventHandler();
    var queuedEvents = [];
    var currentFire = queuedFire;

    function add(context, handler) {
        eventHandler.modifier.add(context, handler);
        if (queuedEvents !== null) {
            currentFire = eventFire;
            for (var i = 0; i < queuedEvents.length; ++i) {
                fire.apply(this, queuedEvents[i]);
            }
            queuedEvents = null;
        }
    }

    function remove(context, handler) {
        eventHandler.modifier.remove(context, handler);
    }

    this.modifier = {
        add: add,
        remove: remove
    }

    function queuedFire() {
        queuedEvents.push(arguments);
    }

    function eventFire() {
        eventHandler.fire.apply(eventHandler, arguments);
    }

    function fire() {
        return currentFire.apply(this, arguments);
    }
    this.fire = fire;
}