import { Uri } from 'hr.uri';
import * as di from 'hr.di';

export class HistoryArgs<T> {
    constructor(private _uri: Uri, private basePath: string){

    }

    public get query(){
        return this._uri.getQueryObject();
    }

    public get inPagePath(){
        return this._uri.path.substring(this.basePath.length);
    }
}

export interface IHistoryHandler<T> {
    onPopState(args: HistoryArgs<T>);
}

export abstract class IHistoryManager {
    public abstract registerHandler<T>(name: string, handler: IHistoryHandler<T>);

    public abstract pushState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): void;

    public abstract replaceState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): void;

    public abstract getCurrentState<T>(): HistoryArgs<T> | null;
}

interface IHistoryEntry<T> {
    handler: string;
}

export class HistoryManager implements IHistoryManager {
    private pageBaseUrl: string;
    private handlers: { [key: string]: IHistoryHandler<any> } = {};

    constructor(pageBaseUrl: string) {
        this.pageBaseUrl = pageBaseUrl;
        window.addEventListener("popstate", (evt: PopStateEvent) => this.handlePopState(evt));
    }

    private handlePopState(evt: PopStateEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        var state: IHistoryEntry<any> = evt.state;
        if (state) {
            var handler = this.handlers[state.handler];
            if (handler !== undefined) {
                handler.onPopState(new HistoryArgs(new Uri(), this.pageBaseUrl));
            }
        }
    }

    public registerHandler<T>(name: string, handler: IHistoryHandler<T>) {
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

    private createState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null, uri: Uri): IHistoryEntry<T> {
        uri.path = this.pageBaseUrl;
        if(inPagePath){
            uri.path += inPagePath;
        }
        uri.setQueryFromObject(query);
        return {
            handler: handler
        };
    }

    public getCurrentState<T>(): HistoryArgs<T> | null {
        return new HistoryArgs(new Uri(), this.pageBaseUrl);
    }
}

export class NullHistoryManager implements IHistoryManager {
    constructor() {
        
    }

    public registerHandler<T>(name: string, handler: IHistoryHandler<T>) {
        
    }

    public pushState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): void {
        
    }

    public replaceState<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): void {
        
    }

     public getCurrentState<T>(): HistoryArgs<T> | null {
        return null;
    }
}