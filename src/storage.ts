///<amd-module-off name="hr.storage"/>

"use strict";

/**
 * This interface abstracts the type of storage we are using.
 */
export interface IStorageDriver {
    /**
     * Get the value stored by the driver, will be null if there is no value
     */
    getValue(): string | null;

    /**
     * Set the value stored by the driver.
     */
    setValue(val: string): void;

    /**
     * Erase the value stored by the driver.
     */
    erase(): void;
}

export class CookieStorageDriver implements IStorageDriver {
    protected path: string = '/';
    protected days: number = undefined;

    constructor(protected name: string, days?: number, path?: string) {
        if (days !== undefined && days !== null) {
            this.days = days;
        }
        if (path !== undefined) {
            this.path = path;
        }
    }

    getValue(): string | null {
        return CookieStorageDriver.readRaw(this.name);
    }

    setValue(val: string): void {
        CookieStorageDriver.createRaw(this.name, val, this.path, this.days);
    }

    //These three functions (createRaw, readRaw and erase) are from
    //http://www.quirksmode.org/js/cookies.html
    //The names were changed

    /**
     * Create a cookie on the doucment.
     * @param {type} name - The name of the cookie
     * @param {type} value - The value of the cookie
     * @param {type} days - The expiration in days for the cookie
     */
    public static createRaw(name: string, value: string, path: string, days: number): void {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toUTCString();
        }
        else var expires = "";
        document.cookie = name + "=" + value + expires + "; path=" + path;
    }

    /**
     * Read a cookie from the document.
     * @param {type} name - The name of the cookie to read
     * @returns {type} - The cookie value.
     */
    public static readRaw(name): string | null {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    /**
     * Erase a cookie from the document.
     * @param {type} name
     */
    public erase(): void {
        CookieStorageDriver.createRaw(this.name, "", this.path, -1);
    }
}

export class SessionStorageDriver implements IStorageDriver {
    constructor(protected name: string) {

    }

    /**
     * Get the value stored by the driver, will be null if there is no value
     */
    getValue(): string | null {
        return sessionStorage.getItem(this.name);
    }

    /**
     * Set the value stored by the driver.
     */
    setValue(val: string): void {
        sessionStorage.setItem(this.name, val);
    }

    /**
     * Erase the value stored by the driver.
     */
    erase(): void {
        this.setValue(null);
    }
}

export class LocalStorageDriver implements IStorageDriver {
    constructor(protected name: string) {

    }

    /**
     * Get the value stored by the driver, will be null if there is no value
     */
    getValue(): string | null {
        return localStorage.getItem(this.name);
    }

    /**
     * Set the value stored by the driver.
     */
    setValue(val: string): void {
        localStorage.setItem(this.name, val);
    }

    /**
     * Erase the value stored by the driver.
     */
    erase(): void {
        this.setValue(null);
    }
}

export interface IStorage<T> {
    getValue(defaultValue?: T): T;
    setValue(val: T): void;
    erase(): void;
}

export type JsonReplacerCb = (key: string, value: any) => any | (number | string)[] | null;

export class JsonStorage<T> implements IStorage<T> {
    private replacer: JsonReplacerCb;
    private space: string | number;

    constructor(private storageDriver: IStorageDriver) {

    }

    setSerializerOptions(replacer: JsonReplacerCb, space?: string | number) {
        this.replacer = replacer;
        this.space = space;
    }

    getValue(defaultValue?: T): T {
        var str = this.storageDriver.getValue();
        var recovered: T;
        if (str !== null) {
            recovered = JSON.parse(str);
        }
        else {
            recovered = defaultValue;
        }
        return recovered;
    }

    setValue(val: T): void {
        this.storageDriver.setValue(JSON.stringify(val, this.replacer, this.space));
    }

    erase() {
        this.storageDriver.erase();
    }
}

export class StringStorage implements IStorage<string> {
    constructor(private storageDriver: IStorageDriver) {

    }

    getValue(defaultValue?: string): string {
        return this.storageDriver.getValue();
    }

    setValue(val: string): void {
        this.storageDriver.setValue(val);
    }

    erase() {
        this.storageDriver.erase();
    }
}