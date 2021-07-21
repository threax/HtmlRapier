import { Uri } from './uri';
import * as di from './di';

export class DeepLinkArgs {
    constructor(private _uri: Uri, private basePath: string, private proto: {} | null){

    }

    public get query(){
        var query = this._uri.getQueryObject();
        //Merge query with proto, can't use it as a direct prototype for query because of how it is built
        if (this.proto !== null) {
            for (var key in this.proto) {
                if (query[key] === undefined) {
                    query[key] = this.proto[key];
                }
            }
        }
        return query;
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
 * Any paths added will be normalized to only contain forward slashes / and to not end with a slash.
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
    public abstract getCurrentState<T>(proto?: {} | null): DeepLinkArgs | null;
}

interface IDeepLinkEntry {
    handler: string;
}

export class DeepLinkManager implements IDeepLinkManager {
    private pageBaseUrl: string;
    private handlers: { [key: string]: IDeepLinkHandler } = {};

    constructor(pageBaseUrl: string) {
        this.pageBaseUrl = this.normalizePath(pageBaseUrl);
        window.addEventListener("popstate", (evt: PopStateEvent) => this.handlePopState(evt));
    }

    private handlePopState(evt: PopStateEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        var state: IDeepLinkEntry = evt.state;
        if (state) {
            var handler = this.handlers[state.handler];
            if (handler !== undefined) {
                handler.onPopState(new DeepLinkArgs(new Uri(), this.pageBaseUrl, null));
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

    public getCurrentState<T>(proto?: {} | null): DeepLinkArgs | null {
        if (proto === undefined) {
            proto = null;
        }
        return new DeepLinkArgs(new Uri(), this.pageBaseUrl, proto);
    }

    private createState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null, uri: Uri): IDeepLinkEntry {
        uri.directory = this.pageBaseUrl;
        if(inPagePath){
            uri.directory += this.normalizePath(inPagePath);
        }
        uri.setQueryFromObject(query);
        return {
            handler: handler
        };
    }

    private normalizePath(url: string): string{
        if(url){ //Yes, we also want to skip empty string here
            url = url.replace('\\', '/');
            if(url[0] !== '/'){ //Make sure there is a leading /
                url = '/' + url;
            }
            if(url[url.length - 1] === '/'){ //Remove any trailing /
                url = url.substring(0, url.length - 1);
            }
        }
        return url;
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

    public getCurrentState<T>(proto?: {} | null): DeepLinkArgs | null {
        return null;
    }
}

export class DeepLinkBaseUrlProvider {
    constructor(private pageBaseUrl: string) {

    }

    public get baseUrl() {
        return this.pageBaseUrl;
    }
}

export function setPageUrl(services: di.ServiceCollection, pageBaseUrl: string) {
    services.tryAddShared(DeepLinkBaseUrlProvider, s => new DeepLinkBaseUrlProvider(pageBaseUrl));
}

export function addServices(services: di.ServiceCollection) {
    services.tryAddShared(IDeepLinkManager, s => {
        var linkProvider = s.getRequiredService(DeepLinkBaseUrlProvider);
        return new DeepLinkManager(linkProvider.baseUrl);
    });
}