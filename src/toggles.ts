///<amd-module name="hr.toggles"/>

"use strict";

import * as typeId from 'hr.typeidentifiers';
import * as evts from 'hr.eventdispatcher';

/**
 * An interface for toggles.
 */
export interface Toggle {
    /**
     * Apply a named state to the toggle.
     */
    applyState(name: string);

    /**
     * Determine if this toggle is hooked up to anything. If the element or target for the
     * toggle could not be found, this will be false.
     */
    isUsable(): boolean;
}

var defaultStates = ['on', 'off']; //Reusuable states, so we don't end up creating tons of these arrays

export type TogglePluginBuilder = (element: Element, states: string[], nextToggle: IToggleStates) => IToggleStates;

var togglePlugins: TogglePluginBuilder[] = [];

/**
 * Interface for typed toggles, provides a way to get the states as a string,
 * you should provide the names of all your functions here.
 */
export class TypedToggle implements Toggle {
    protected states: IToggleStates;
    private _currentState: string;
    private events: { [key: string]: evts.ActionEventDispatcher<Toggle>; } = {};

    /**
     * Get the states this toggle can activate.
     */
    public getPossibleStates(): string[] {
        return [];
    }

    /**
     * Set the toggle states used by this strong toggle, should not be called outside of
     * the toggle build function.
     */
    public setStates(states: IToggleStates) {
        this.states = states;
        this.states.setToggle(this);
    }

    public applyState(name: string) {
        if (this._currentState !== name) {
            this._currentState = name;
            if (this.states.applyState(name)) {
                this.fireStateChange(name);
            }
        }
    }

    public isUsable(): boolean {
        return !(typeId.isObject(this.states) && this.states.constructor.prototype == NullStates.prototype);
    }

    public get currentState() {
        return this._currentState;
    }

    public fireStateChange(name: string) {
        this._currentState = name; //This only should happen as the result of an applystate call or the state being changed externally to the library
        //The event will only fire on the current state, so it is safe to set the current state here.
        if (this.events[name] !== undefined) {
            this.events[name].fire(this);
        }
    }

    public getStateEvent(name: string) {
        if (this.events[name] === undefined) {
            this.events[name] = new evts.ActionEventDispatcher<Toggle>();
        }
        return this.events[name];
    }
}

/**
 * A toggle that is on and off.
 */
export class OnOffToggle extends TypedToggle {
    private static states = ['on', 'off'];

    public on() {
        this.applyState("on");
    }

    public off() {
        this.applyState("off");
    }

    public get onEvent() {
        return this.getStateEvent('on').modifier;
    }

    public get offEvent() {
        return this.getStateEvent('off').modifier;
    }

    public getPossibleStates() {
        return OnOffToggle.states;
    }

    public toggle() {
        if (this.mode) {
            this.off();
        }
        else {
            this.on();
        }
    }

    public get mode(): boolean {
        return this.currentState === "on";
    }

    public set mode(value: boolean) {
        var currentOn = this.mode;
        if (currentOn && !value) {
            this.off();
        }
        else if (!currentOn && value) {
            this.on();
        }
    }
}

/**
 * The Group defines a collection of toggles that can be manipulated together.
 */
export class Group {
    private toggles: Toggle[];

    constructor(...toggles: Toggle[]) {
        this.toggles = toggles;
    }

    /**
     * Add a toggle to the group.
     * @param toggle - The toggle to add.
     */
    add(toggle: Toggle) {
        this.toggles.push(toggle);
    }

    /**
     * This function will set all toggles in the group (including the passed one if its in the group) 
     * to the hideState and then will set the passed toggle to showState.
     * @param toggle - The toggle to set.
     * @param {string} [showState] - The state to set the passed toggle to.
     * @param {string} [hideState] - The state to set all other toggles to.
     */
    activate(toggle, showState?: string, hideState?: string) {
        if (showState === undefined) {
            showState = 'on';
        }

        if (hideState === undefined) {
            hideState = 'off';
        }

        for (var i = 0; i < this.toggles.length; ++i) {
            this.toggles[i].applyState(hideState);
        }
        toggle.applyState(showState);
    }
}

/**
 * Add a toggle plugin that can create additional items on the toggle chain.
 * @param {type} plugin
 */
export function addTogglePlugin(plugin: TogglePluginBuilder) {
    togglePlugins.push(plugin);
}

export interface IToggleStates {
    /**
     * Apply the named state to the toggle. Return true to let the toggle fire the activated
     * event and false to indicate that the subsystem will fire the event at the appropriate time.
     * @param name The state to apply
     */
    applyState(name: string): boolean;

    /**
     * Set the toggle that these states will use. This should only be called from within setStates in TypedToggle.
     * This provides the links needed to fire the events from the toggle.
     */
    setToggle(toggle: TypedToggle): void;
}

/**
 * Base class for toggle state collections. Implemented as a chain.
 * @param {ToggleStates} next
 */
export abstract class ToggleStates implements IToggleStates {
    private next: IToggleStates;
    private states: { [k: string]: any } = {};
    private toggle: TypedToggle;

    constructor(next: IToggleStates) {
        this.next = next;
    }

    public addState(name: string, value: string) {
        this.states[name] = value;
    }

    public applyState(name: string): boolean {
        var state = this.states[name];
        var fireEvent = this.activateState(state);
        if (this.next) {
            fireEvent = this.next.applyState(name) || fireEvent;
        }
        return fireEvent;
    }

    /**
     * This function does the work to actually activate a state. It will return true 
     * to allow the toggle to fire the event associated with this state or false to 
     * indicate that the subsystem will fire the event itself at the appropriate time.
     * @param value The state to activate
     */
    protected abstract activateState(value: any): boolean;

    public setToggle(toggle: TypedToggle): void {
        this.toggle = toggle;
    }

    protected fireStateChange(name: string) {
        if (this.toggle) {
            this.toggle.fireStateChange(name);
        }
    }
}

/**
 * This class holds multiple toggle states as a group. This handles multiple toggles
 * with the same name by bunding them up turning them on and off together.
 * @param {ToggleStates} next
 */
export class MultiToggleStates implements IToggleStates {
    private childStates: IToggleStates[];

    constructor(childStates: IToggleStates[]) {
        this.childStates = childStates;
    }

    public applyState(name: string): boolean {
        var fireEvent = true;
        for (var i = 0; i < this.childStates.length; ++i) {
            fireEvent = this.childStates[i].applyState(name) || fireEvent; //Fire event first so we always fire all the items in the chain
        }
        return fireEvent;
    }

    public setToggle(toggle: TypedToggle): void {
        for (var i = 0; i < this.childStates.length; ++i) {
            this.childStates[i].setToggle(toggle);
        }
    }
}

export class DisabledToggleStates extends ToggleStates {
    constructor(private element, next: IToggleStates) {
        super(next);
    }

    public activateState(style): boolean {
        if (Boolean(style)) {
            this.element.setAttribute('disabled', 'disabled');
        }
        else {
            this.element.removeAttribute('disabled');
        }
        return true;
    }
}

export class ReadonlyToggleStates extends ToggleStates {
    constructor(private element, next: IToggleStates) {
        super(next);
    }

    public activateState(style): boolean {
        if (Boolean(style)) {
            this.element.setAttribute('readonly', 'readonly');
        }
        else {
            this.element.removeAttribute('readonly');
        }
        return true;
    }
}

/**
 * This class toggles attributes on and off for an element.
 */
export class AttributeToggleStates extends ToggleStates {
    constructor(private attrName: string, private element, next: IToggleStates) {
        super(next);
    }

    public activateState(style): boolean {
        if (style) {
            this.element.setAttribute(this.attrName, style);
        }
        else {
            this.element.removeAttribute(this.attrName);
        }
        return true;
    }
}

/**
 * A simple toggle state that does nothing. Used to shim correctly if no toggles are defined for a toggle element.
 */
class NullStates extends ToggleStates {
    constructor(next: ToggleStates) {
        super(next);
    }

    public activateState(value: string): boolean {
        return true;
    }
}

/**
 * A toggler that toggles style for an element
 */
class StyleStates extends ToggleStates {
    private element;
    private originalStyles;

    constructor(element, next: ToggleStates) {
        super(next);
        this.element = element;
        this.originalStyles = element.style.cssText || "";
    }

    public activateState(style): boolean {
        if (style) {
            this.element.style.cssText = this.originalStyles + style;
        }
        else {
            this.element.style.cssText = this.originalStyles;
        }
        return true;
    }
}

/**
* A toggler that toggles classes for an element. Supports animations using an 
* idle attribute (data-hr-class-idle) that if present will have its classes
* applied to the element when any animations have completed.
*/
class ClassStates extends ToggleStates {
    private element;
    private originalClasses;
    private idleClass;
    private stopAnimationCb; //Callback retains this context.

    constructor(element, next: ToggleStates) {
        super(next);
        this.element = element;
        this.originalClasses = element.getAttribute("class") || "";
        this.idleClass = element.getAttribute('data-hr-class-idle');
        this.stopAnimationCb = () => { this.stopAnimation() };
    }

    public activateState(classes): boolean {
        if (classes) {
            this.element.setAttribute("class", this.originalClasses + ' ' + classes);
        }
        else {
            this.element.setAttribute("class", this.originalClasses);
        }
        this.startAnimation();
        return true;
    }

    private startAnimation() {
        if (this.idleClass) {
            this.element.classList.remove(this.idleClass);
            this.element.removeEventListener('transitionend', this.stopAnimationCb);
            this.element.removeEventListener('animationend', this.stopAnimationCb);
            this.element.addEventListener('transitionend', this.stopAnimationCb);
            this.element.addEventListener('animationend', this.stopAnimationCb);
        }
    }

    private stopAnimation() {
        this.element.removeEventListener('transitionend', this.stopAnimationCb);
        this.element.removeEventListener('animationend', this.stopAnimationCb);
        this.element.classList.add(this.idleClass);
    }
}

/**
 * Extract all the states from a given element to build a single toggle in the chain.
 * You pass in the prefix and states you want to extract as well as the constructor
 * to use to create new states.
 * @param {type} element - The element to extract toggles from
 * @param {type} states - The states to look for
 * @param {type} attrPrefix - The prefix for the attribute that defines the state. Will be concated with each state to form the lookup attribute.
 * @param {type} toggleConstructor - The constructor to use if a toggle is created.
 * @param {type} nextToggle - The next toggle to use in the chain
 * @returns {type} The toggle that should be the next element in the chain, will be the new toggle if one was created or nextToggle if nothing was created.
 */
function extractStates(element: Element, states: string[], attrPrefix: string, toggleConstructor: any, nextToggle: IToggleStates): IToggleStates {
    var toggleStates: ToggleStates = null;
    for (var i = 0; i < states.length; ++i) {
        var name = states[i];
        var attr = attrPrefix + name;
        if (element.hasAttribute(attr)) {
            var value = element.getAttribute(attr);
            if (toggleStates === null) {
                toggleStates = new toggleConstructor(element, nextToggle);
            }
            toggleStates.addState(name, value);
        }
    }
    if (toggleStates) {
        return toggleStates;
    }
    return nextToggle;
}

const toggleAttributeStart = 'data-hr-attr-';

function extractAttrStates(element: Element, states: string[], nextToggle: IToggleStates): IToggleStates {
    var lastCreated: AttributeToggleStates = null;
    var ariaStates: { [ariaName: string]: {}; } = {};
    var attributes = element.attributes;
    for (var a = 0; a < attributes.length; ++a) { //For each attribute
        var attr = attributes[a];
        var attrName = (<any>attr.name);
        for (var i = 0; i < states.length; ++i) { //For each state
            var state = states[i];
            var end = "-" + state;
            if (attrName.startsWith(toggleAttributeStart) && attrName.endsWith(end)) { //If the attribute name matches the expected value (data-hr-attr-ATTRIBUTE-STATE)
                var toggleAttrName = attrName.substring(toggleAttributeStart.length, attrName.length - end.length);
                if (lastCreated === null) { //See if we need to create the attribute toggle
                    nextToggle = lastCreated = new AttributeToggleStates(toggleAttrName, element, nextToggle);
                }
                lastCreated.addState(state, attr.value);
            }
        }

        lastCreated = null; //Reset the last created toggle, so a new one is made for each attribute.
    }

    return nextToggle;
}

export function getStartState(element) {
    var attr = "data-hr-state";
    if (element.hasAttribute(attr)) {
        var value = element.getAttribute(attr);
        return value;
    }
    return null;
}

/**
 * Build a toggle chain from the given element
 * @param {string} element - The element to build toggles for
 * @param {string[]} [stateNames] - The states the toggle needs, will create functions on 
 * the toggle for each one. If this is undefined will default to "on" and "off".
 * @returns A new ToggleChain with the defined states as functions
 */
export function build(element: Element, stateNames: string[]): IToggleStates {
    if (stateNames === undefined) {
        stateNames = defaultStates;
    }
    var toggle = null;

    if (element !== null) {
        toggle = extractStates(element, stateNames, 'data-hr-style-', StyleStates, toggle);
        toggle = extractStates(element, stateNames, 'data-hr-class-', ClassStates, toggle);
        toggle = extractStates(element, stateNames, 'data-hr-disabled-', DisabledToggleStates, toggle);
        toggle = extractStates(element, stateNames, 'data-hr-readonly-', ReadonlyToggleStates, toggle);

        //Find aria states
        toggle = extractAttrStates(element, stateNames, toggle);

        //Now toggle plugin chain
        for (var i = 0; i < togglePlugins.length; ++i) {
            toggle = togglePlugins[i](element, stateNames, toggle);
        }
    }

    //If we get all the way here with no toggle, use the null toggle.
    if (toggle === null) {
        toggle = new NullStates(toggle);
    }

    return toggle;
}