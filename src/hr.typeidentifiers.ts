/**
 * Determine if a variable is an array.
 * @param test - The object to test
 * @returns {boolean} - True if the object is an array
 */
export function isArray(test) {
    return Array.isArray(test);
}

/**
 * Determine if a variable is a string.
 * @param test - The object to test
 * @returns {boolean} - True if a string, false if not
 */
export function isString(test) {
    return typeof (test) === 'string';
}

/**
 * Determine if a variable is a function.
 * @param test - The object to test
 * @returns {boolean} - True if a function, false if not
 */
export function isFunction(test) {
    return typeof (test) === 'function';
}

/**
 * Determine if a variable is an object.
 * @param test - The object to test
 * @returns {boolean} - True if an object, false if not
 */
export function isObject(test) {
    return typeof test === 'object';
}

export function isForEachable(test) {
    return test && isFunction(test['forEach']);
}