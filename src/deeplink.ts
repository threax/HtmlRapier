///<amd-module name="hr.deeplink"/>

import { Uri } from 'hr.uri';
import * as di from 'hr.di';

export class DeepLinkArgs {
    constructor(private _uri: Uri, private basePath: string){

    }

    public get query(){
        return this._uri.getQueryObject();
    }

    public get inPagePath(){
        return this._uri.path.substring(this.basePath.length);
    }
}

export interface IDeepLinkHandler {
    onPopState(args: DeepLinkArgs);
}

/**
 * This interface provides a way to handle deep links on a page. This makes it easy to setup
 * history for queries and paths that are under the current page. It has an event that will fire
 * when the user clicks forward or back. It also makes it easy to get the data out if the page was just loaded.
 */
export abstract class IDeepLinkManager {
    /**
     * Register a new handler to get fired when onpopstate fires. The handler will only fire for states that are registered with it.
     * @param name The name of the handler, must be unique.
     * @param handler The handler to call when firing the event.
     */
    public abstract registerHandler<T>(name: string, handler: IDeepLinkHandler);

    /**
     * Push a new state using history.pushstate.
     * @param handler The handler that will recieve the onpopstate event.
     * @param inPagePath The path on the page, will be under the base path set, can be null to have only the base path.
     * @param query An object to set as the query, can be null to clear the query.
     */
    public abstract pushState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): void;

    /**
     * Replace a new state using history.pushstate.
     * @param handler The handler that will recieve the onpopstate event.
     * @param inPagePath The path on the page, will be under the base path set, can be null to have only the base path.
     * @param query An object to set as the query, can be null to clear the query.
     */
    public abstract replaceState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): void;

    /**
     * Get the current link state as a DeepLinkArgs. This will be the same as if a history event had fired, but for the current page url.
     * Can also be null if there is no valid state to get.
     */
    public abstract getCurrentState<T>(): DeepLinkArgs | null;
}

interface IDeepLinkEntry {
    handler: string;
}

export class DeepLinkManager implements IDeepLinkManager {
    private pageBaseUrl: string;
    private handlers: { [key: string]: IDeepLinkHandler } = {};

    constructor(pageBaseUrl: string) {
        this.pageBaseUrl = pageBaseUrl;
        window.addEventListener("popstate", (evt: PopStateEvent) => this.handlePopState(evt));
    }

    private handlePopState(evt: PopStateEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        var state: IDeepLinkEntry = evt.state;
        if (state) {
            var handler = this.handlers[state.handler];
            if (handler !== undefined) {
                handler.onPopState(new DeepLinkArgs(new Uri(), this.pageBaseUrl));
            }
        }
    }

    public registerHandler<T>(name: string, handler: IDeepLinkHandler) {
        if(this.handlers[name] !== undefined){
            throw new Error("Attempted to register an IHistoryHandler named '" + name + "' multiple times, only one is allowed.");
        }
        this.handlers[name] = handler;
    }

    public pushState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null, title?: string): void {
        var uri = new Uri();
        var state = this.createState(handler, inPagePath, query, uri);
        if(title === undefined){
            title = document.title;
        }
        history.pushState(state, title, uri.build());
    }

    public replaceState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null, title?: string): void {
        var uri = new Uri();
        var state = this.createState(handler, inPagePath, query, uri);
        if(title === undefined){
            title = document.title;
        }
        history.replaceState(state, title, uri.build());
    }

    private createState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null, uri: Uri): IDeepLinkEntry {
        uri.path = this.pageBaseUrl;
        if(inPagePath){
            uri.path += inPagePath;
        }
        uri.setQueryFromObject(query);
        return {
            handler: handler
        };
    }

    public getCurrentState<T>(): DeepLinkArgs | null {
        return new DeepLinkArgs(new Uri(), this.pageBaseUrl);
    }
}

export class NullDeepLinkManager implements IDeepLinkManager {
    constructor() {
        
    }

    public registerHandler<T>(name: string, handler: IDeepLinkHandler) {
        
    }

    public pushState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): void {
        
    }

    public replaceState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): void {
        
    }

     public getCurrentState<T>(): DeepLinkArgs | null {
        return null;
    }
}