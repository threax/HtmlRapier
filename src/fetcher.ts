export interface Fetcher {
    fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
}