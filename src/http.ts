"use strict";

/**
 * A simple function to get data from a url without caching. This still
 * uses fetch, but is available since this is a a pretty common operation.
 * If you need something more advanced use fetch directly.
 * @param {string} url - The url to get from
 * @returns
 */
export function get<T>(url: string) : Promise<T> {
    return fetch(url, {
        method: "GET",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    }).then((response) => {
        return processClientGet(response);
    });
}

function processClientGet<T>(response: Response) : Promise<T> {
    return response.text().then((data) => {
        let resultData = data === "" ? null : JSON.parse(data);
        if (response.status > 199 && response.status < 300) {
            return resultData;
        }
        throw resultData;
    });
}