///<amd-module name="hr.fetcher"/>

export abstract class Fetcher {
    abstract fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
}