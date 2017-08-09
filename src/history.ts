import { Uri } from 'hr.uri';
import * as di from 'hr.di';

export abstract class IHistoryManager {
    public abstract pushQueryState(query: any): void;

    public abstract getCurrentQuery(): {};
}

export class HistoryManager {
    public static get InjectorArgs(): di.DiFunction<any>[] {
        return [];
    }

    private pageBaseUrl: string;

    constructor(pageBaseUrl: string) {
        this.pageBaseUrl = pageBaseUrl;
    }

    public pushQueryState(query: any): void {
        var uri = new Uri();
        uri.path = this.pageBaseUrl;
        uri.setQueryFromObject(query);
        history.pushState(query, document.title, uri.build());
    }

    public getCurrentQuery(): {} {
        var uri = new Uri();
        return uri.getQueryObject();
    }
}

export function addServices(services: di.ServiceCollection): void {
    services.tryAddShared(IHistoryManager, HistoryManager);
}