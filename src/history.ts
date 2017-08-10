import { Uri } from 'hr.uri';
import * as di from 'hr.di';

export class HistoryArgs<T> {
    constructor(private _data: T){

    }

    public get data(){
        return this._data;
    }
}

export interface IHistoryHandler<T> {
    onPopState(args: HistoryArgs<T>);
}

export abstract class IHistoryManager {
    public abstract registerHandler<T>(name: string, handler: IHistoryHandler<T>);

    public abstract pushQueryState<T extends {}>(handler: string, query: any): void;

    public abstract replaceQueryState<T extends {}>(handler: string, query: any): void;

    public abstract getCurrentQuery(): {};
}

interface IHistoryEntry<T> {
    handler: string;
    data: T;
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
                handler.onPopState(new HistoryArgs(state.data));
            }
        }
    }

    public registerHandler<T>(name: string, handler: IHistoryHandler<T>) {
        if(this.handlers[name] !== undefined){
            throw new Error("Attempted to register an IHistoryHandler named '" + name + "' multiple times, only one is allowed.");
        }
        this.handlers[name] = handler;
    }

    public pushQueryState<T extends {}>(handler: string, query: T): void {
        var uri = new Uri();
        uri.path = this.pageBaseUrl;
        uri.setQueryFromObject(query);
        var historyObj: IHistoryEntry<T> = {
            handler: handler,
            data: query
        };
        history.pushState(historyObj, document.title, uri.build());
    }

    public replaceQueryState<T extends {}>(handler: string, query: T): void {
        var uri = new Uri();
        uri.path = this.pageBaseUrl;
        uri.setQueryFromObject(query);
        var historyObj: IHistoryEntry<T> = {
            handler: handler,
            data: query
        };
        history.replaceState(historyObj, document.title, uri.build());
    }

    public getCurrentQuery(): {} {
        var uri = new Uri();
        return uri.getQueryObject();
    }
}

export class NullHistoryManager implements IHistoryManager {
    constructor() {
        
    }

    public registerHandler<T>(name: string, handler: IHistoryHandler<T>) {
        
    }

    public pushQueryState<T extends {}>(handler: string, query: T): void {
        
    }

    public replaceQueryState<T extends {}>(handler: string, query: T): void {
        
    }

    public getCurrentQuery(): {} {
        return null;
    }
}